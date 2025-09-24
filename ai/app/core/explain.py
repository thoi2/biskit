import os, time, textwrap
from typing import Dict, Any, List, Tuple

import torch
from openai import AsyncOpenAI

from .utils import log
from .settings import settings
from .data_io import Ctx

# ──────────────────────────────────────────────────────────────────────────────
# 한글 라벨 & 포맷터
# ──────────────────────────────────────────────────────────────────────────────
KOR_FEATURE_LABEL = {
    "pop": "거주 인구",
    "work_pop": "직장 인구(출퇴근)",
    "bus_stop_count": "버스 정류장",
    "school_count": "학교 수",
    "library_count": "도서관 수",
    "nightview_count": "야간 유동 스팟",
    "subway_traffic": "지하철 유동량",
}

def _bucket(score: float) -> Tuple[str, str]:
    s = abs(score)
    if s >= 0.60: level = "매우 큼"
    elif s >= 0.35: level = "큼"
    elif s >= 0.20: level = "보통"
    elif s > 0.05: level = "약함"
    else: level = "매우 약함"
    direction = "↑" if score > 0 else ("↓" if score < 0 else "·")
    return level, direction

def _pretty_env(pairs: List[Tuple[str, float]], top: int = 5) -> str:
    items = []
    for name, score in pairs[:top]:
        label = KOR_FEATURE_LABEL.get(name, name)
        lvl, dirc = _bucket(score)
        items.append(f"{label}({dirc}, {lvl})")
    return " / ".join(items) if items else "해당 없음"

# ──────────────────────────────────────────────────────────────────────────────
# 경량 설명자: 서브그래프 가상노드 특성 기반(Explainer 없이 동작)
# ──────────────────────────────────────────────────────────────────────────────
async def explain_at_location(
    ctx: Ctx,
    lat: float,
    lon: float,
    cid: int,
    target_year: int | None = None,
    subgraph_builder=None,
    knobs: dict | None = None,
    hazard: list | None = None,  # New parameter
) -> Dict[str, Any]:
    """
    주어진 위치(lat, lon)와 업종 cid에 대해:
      - subgraph_builder로 서브그래프 구성
      - 가상노드 특성 벡터를 읽어 환경/카테고리 기여도(의사 점수) 계산
      - 모델로 hazard 추론(있으면)까지 수행
    반환: dict(hazard, target_year, env_top, cat_top, edges, virtual_index, sub_nodes, sub_edges)
    """
    if subgraph_builder is None:
        from .subgraph import build_augmented_subgraph_for_category
        subgraph_builder = build_augmented_subgraph_for_category

    knobs = knobs or {}
    sub, v_idx = await subgraph_builder(ctx, lat, lon, int(cid), knobs)

    # feature 분해
    v = sub.x[int(v_idx)].detach().cpu().numpy()
    env_feat_count = len(ctx.env_feat_names)

    env_vals = v[:env_feat_count]  # 0..1
    # 중심 0.5 기준으로 ±로 바꿔 '방향'을 만들자 (Explainer가 없으니 의사 방향)
    env_scores = (env_vals - 0.5).tolist()
    env_pairs = list(zip(ctx.env_feat_names, env_scores))
    env_pairs.sort(key=lambda x: abs(x[1]), reverse=True)

    # 카테고리 '기여'는 현재 선택된 업종에 1.0 (나머지 0.0)로 의사화
    cat_scores = v[env_feat_count:]
    cat_pairs: List[Tuple[str, float]] = []
    if hasattr(ctx, "cat_index_map"):
        inv_cat = {j: i for i, j in ctx.cat_index_map.items()}
        for j, score in enumerate(cat_scores):
            cid_j = inv_cat.get(j, None)
            if cid_j is None:
                name = f"cat_{j}"
            else:
                name = ctx.id2name.get(int(cid_j), f"cat_{cid_j}")
            cat_pairs.append((name, float(score)))
        cat_pairs.sort(key=lambda x: abs(x[1]), reverse=True)
    else:
        cat_pairs = []

    # 모델 추론해서 hazard 가져오기 (pre-computed hazard가 없으면)
    haz = hazard  # Use the provided hazard if available
    if haz is None and ctx.model is not None:
        target_dim = int(ctx.META["feature_dim"])
        # 차원 보정(pad/trim)
        if sub.x.size(1) < target_dim:
            sub.x = torch.cat([sub.x, torch.zeros((sub.x.size(0), target_dim - sub.x.size(1)), dtype=sub.x.dtype)], dim=1)
        elif sub.x.size(1) > target_dim:
            sub.x = sub.x[:, :target_dim]

        dev = ctx.device
        sub = sub.to(dev, non_blocking=True)
        ctx.model.eval()
        with torch.no_grad():
            logits, _ = ctx.model(sub.x, sub.edge_index)
            haz = torch.sigmoid(logits[int(v_idx)]).detach().cpu().numpy().tolist()

    result = {
        "hazard": haz if haz is not None else [],
        "target_year": (target_year if target_year is not None else -1),
        "env_top": env_pairs,        # [(env_name, score), ...]
        "cat_top": cat_pairs,        # [(category_name, score), ...]
        "edges": [],                 # 경량 버전: 엣지 중요도 생략
        "virtual_index": int(v_idx),
        "sub_nodes": int(sub.num_nodes),
        "sub_edges": int(sub.num_edges),
    }
    return result

# ──────────────────────────────────────────────────────────────────────────────
# 외부 LLM 설명 + 폴백
# ──────────────────────────────────────────────────────────────────────────────
async def llm_explain(settings, lat, lon, cid, cat_name, pred, exp) -> str:
    # LLM 비활성 시 내부 설명 생성
    if not settings.LLM_ENABLE:
        env_summary = _pretty_env(exp.get('env_top', []), top=5)
        cat_summary = _pretty_env(exp.get('cat_top', []), top=1)
        
        # pred 값은 리스트 형태이므로 첫 번째 값을 사용
        hazard_score = pred[0] if pred and isinstance(pred, list) and len(pred) > 0 else 0.5
        
        if hazard_score >= 0.7:
            hazard_level = "매우 높을 것으로 예상됩니다."
        elif hazard_score >= 0.5:
            hazard_level = "높을 것으로 예상됩니다."
        elif hazard_score >= 0.3:
            hazard_level = "보통 수준으로 예상됩니다."
        else:
            hazard_level = "낮을 것으로 예상됩니다."

        return (
            f"주변 특성: {env_summary}. "
            f"업종 특성 영향: {cat_summary}. "
            f"이러한 특성 조합으로 {cat_name} 업종의 폐업 위험은 {hazard_level}"
        )

    # GMS_KEY 미설정 시 폴백 (LLM_ENABLE이 True인데 키가 없는 경우)
    if not settings.GMS_KEY:
        return (
            f"(LLM 키 미설정) 주변 특성: { _pretty_env(exp.get('env_top', []), top=5) }. "
            f"업종 특성 영향: { _pretty_env(exp.get('cat_top', []), top=1) }. "
            f"이 특성 조합으로 해당 업종의 폐업 위험이 결정된 것으로 추정됩니다."
        )

    try:
        client = AsyncOpenAI(
            api_key=settings.GMS_KEY,
            base_url=settings.GMS_BASE_URL.rstrip("/")
        )
        sys_prompt = (
            "너는 상권 데이터 분석가야. 아래 정보를 바탕으로 '왜 이 업종의 폐업 위험이 그렇게 나왔는지'를 "
            "비전문가(점주)도 이해할 수 있는 한국어로 3~5문장으로 설명해. "
            "규칙:\n"
            "1) '엣지, 노드, 가상노드, 임베딩' 같은 용어를 절대 쓰지 마. 대신 '인근 지역 특성', '주변 상권 영향' 같은 일상적 표현만 사용해.\n"
            "2) 숫자는 가능하면 쓰지 말고(특히 소수점),강도로 표현해.\n"
            "3) 장점/리스크를 균형 있게 요약하고, 결론은 한 문장으로 깔끔히 마무리.\n"
            "4) 매체는 보고서 요약이므로 존댓말을 사용하고 과장 표현은 피한다."
        )
        env_line = _pretty_env(exp.get("env_top", []), top=5)
        cat_line = _pretty_env(exp.get("cat_top", []), top=1)
        user_prompt = (
            f"[위치] 위도 {lat:.6f}, 경도 {lon:.6f}\n"
            f"[업종] {cat_name} (category_id={cid})\n"
            f"[영향도 상위 환경 특성] {env_line}\n"
            f"[업종 특성 영향] {cat_line}\n"
            "위 정보를 바탕으로 자연스럽게 설명해 주세요."
        )
        log(f"[LLM] PROMPT: {user_prompt}")

        start_time = time.time()
        resp = await client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_completion_tokens=4000,
            timeout=settings.LLM_TIMEOUT,
        )
        end_time = time.time()
        log(f"[LLM] RESPONSE: {resp}")
        log(f"[LLM] Elapsed time: {end_time - start_time:.2f} seconds")
        return resp.choices[0].message.content.strip()

    except Exception as e:
        log(f"[LLM] 실패: {e}")
        return (
            f"(LLM 설명 실패) 주변 특성: { _pretty_env(exp.get('env_top', []), top=5) }. "
            f"업종 특성 영향: { _pretty_env(exp.get('cat_top', []), top=1) }. "
            f"이 특성 조합으로 해당 업종의 폐업 위험이 결정된 것으로 추정됩니다."
        )
