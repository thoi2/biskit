import numpy as np
import torch
from torch_geometric.data import Data
from .utils import log
from .data_io import Ctx

def _hazard_to_survival_and_failure(hazards: np.ndarray):
    S = []
    surv = 1.0
    for p in hazards:
        p = float(p)
        surv *= (1.0 - p)
        S.append(max(0.0, min(1.0, surv)))
    S = np.array(S, dtype=float)
    F = 1.0 - S
    return S, F

def _blended_regions(ctx: Ctx, lat: float, lon: float, k: int, k_max_ratio: float = 2.0):
    d, idxs = ctx.node_tree.query([lat, lon], k=k)
    if np.isscalar(d):
        d, idxs = np.array([d]), np.array([idxs])
    
    # k_max_ratio 로직 추가: 너무 먼 지역은 제외
    max_dist = d.min() * k_max_ratio
    valid_indices = np.where(d <= max_dist)[0]
    d = d[valid_indices]
    idxs = idxs[valid_indices]

    w = 1.0 / (d + 1e-6)
    w /= w.sum()
    codes = [int(ctx.node_codes[j]) for j in np.atleast_1d(idxs)]
    return codes, w

def _region_vec_from_code(ctx: Ctx, code: int, feature_dim: int) -> np.ndarray:
    """env feat만 채우고 나머지는 0; 길이는 feature_dim으로 맞춤"""
    env_feat_count = len(ctx.env_feat_names)
    vec = np.zeros(feature_dim, dtype=np.float32)
    feats = ctx.region_env.get(int(code), {})
    for j, f in enumerate(ctx.env_feat_names):
        denom = ctx.region_max.get(f, 1.0) or 1.0
        vec[j] = float(feats.get(f, 0.0)) / denom
    # cat one-hot은 가상노드에서만 설정
    return vec

def _ensure_feature_dim(x: torch.Tensor, target_dim: int) -> torch.Tensor:
    """모델 입력 차원(META.feature_dim)에 맞춰 0-padding 또는 절단"""
    cur = x.size(1)
    if cur == target_dim:
        return x
    if cur < target_dim:
        pad = torch.zeros((x.size(0), target_dim - cur), dtype=x.dtype, device=x.device)
        return torch.cat([x, pad], dim=1)
    # cur > target_dim
    return x[:, :target_dim]

def build_augmented_subgraph_for_category(ctx: Ctx, lat: float, lon: float, cid: int, knobs: dict):
    """
    전역 그래프에는 '지역 노드'만 있고, 요청별로
    - 인근 k개 지역 노드
    - 가상(virtual) 노드 1개
    로 서브그래프를 만든다.
    """
    k_region = int(knobs.get("k_region", 20))
    k_max_ratio = float(knobs.get("k_max_ratio", 2.0))
    edge_gain = float(knobs.get("edge_gain", 3.0))

    # 1) 인근 지역 k개
    codes, w = _blended_regions(ctx, lat, lon, k_region, k_max_ratio)
    region_globals = []
    for rc in codes:
        if rc in ctx.region_index_map:
            region_globals.append(ctx.region_index_map[rc])
    if not region_globals:
        raise RuntimeError("no region nodes near the point")

    # 2) 서브그래프의 노드 특성 행렬을 구성
    env_feat_count = len(ctx.env_feat_names)
    # 모델이 기대하는 feature_dim (메타에서 고정)
    if ctx.META is None:
        raise RuntimeError("META not loaded; cannot know feature_dim")
    target_dim = int(ctx.META["feature_dim"])
    num_cats_meta = int(ctx.META.get("num_cats", target_dim - env_feat_count))

    # 지역 노드 X
    reg_X = []
    for rc in codes:
        reg_X.append(_region_vec_from_code(ctx, rc, target_dim))
    reg_X = np.vstack(reg_X).astype(np.float32)

    # 가상 노드 X (env는 가중합 + 감쇠/증폭 knob 반영)
    env_gain = float(knobs.get("env_gain", 1.0))
    env_gamma = float(knobs.get("env_gamma", 1.0))
    env_mix = np.zeros(env_feat_count, np.float32)
    for rc, wj in zip(codes, w):
        env_mix += wj * _region_vec_from_code(ctx, rc, target_dim)[:env_feat_count]
    if env_gamma != 1.0:
        env_mix = np.power(np.clip(env_mix, 0.0, 1.0), env_gamma)
    if env_gain != 1.0:
        env_mix = np.clip(env_mix * env_gain, 0.0, 1.0)

    v = np.zeros(target_dim, np.float32)
    v[:env_feat_count] = env_mix
    # 카테고리 원-핫: 메타 차원 범위 안에서만 세움
    # (현재 CSV에 존재하더라도 meta num_cats 범위를 벗어나면 무시)
    # ctx.cat_index_map은 로컬 factorize라 meta와 1:1 보장은 없지만,
    # 같은 STORE로 학습했다면 동일해야 함.
    j = ctx.cat_index_map.get(int(cid), None)
    if (j is not None) and (0 <= j < num_cats_meta):
        v[env_feat_count + j] = 1.0

    # 3) 텐서로 만들기
    sub_x = torch.tensor(np.vstack([reg_X, v[None, :]]), dtype=torch.float32)
    # 4) 엣지: virtual <-> 각 region (중복으로 가중치 효과)
    N = sub_x.size(0)
    virtual_idx = N - 1
    add_src, add_dst = [], []
    for i, wj in enumerate(w):
        reps = max(1, int(round(wj * wj * edge_gain * 10)))
        add_src.extend([virtual_idx] * reps); add_dst.extend([i] * reps)
        add_src.extend([i] * reps); add_dst.extend([virtual_idx] * reps)
    edge_index = torch.tensor([add_src, add_dst], dtype=torch.long)
    sub = Data(x=sub_x, edge_index=edge_index)
    sub.input_nodes = torch.as_tensor([virtual_idx], dtype=torch.long)
    return sub, virtual_idx

@torch.no_grad()
async def predict_hazards_at_location(ctx: Ctx, lat: float, lon: float, cid: int, knobs: dict):
    """서브그래프 구성 → 모델 추론 → hazard/survival/failure"""
    if ctx.model is None or ctx.META is None:
        raise RuntimeError("model or META not loaded")

    sub, _ = await build_augmented_subgraph_for_category(ctx, lat, lon, int(cid), knobs)
    # 모델 입력 차원 보정
    target_dim = int(ctx.META["feature_dim"])
    sub.x = _ensure_feature_dim(sub.x, target_dim)

    dev = ctx.device
    sub = sub.to(dev, non_blocking=True)
    ctx.model.eval()
    logits, _ = ctx.model(sub.x, sub.edge_index)  # [N, H]
    haz = torch.sigmoid(logits[0]).detach().cpu().numpy()
    S, F = _hazard_to_survival_and_failure(haz)
    return {"hazard": haz.tolist(), "survival": S.tolist(), "failure": F.tolist()}
