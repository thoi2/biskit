from .subgraph import predict_hazards_at_location, build_augmented_subgraph_for_category
from .explain import explain_at_location, llm_explain
from .utils import log

def recommend_topk_with_explanations(ctx, settings, lat: float, lon: float, top_k: int = 10):
    try:
        cat_counts = ctx.store_df["category_id"].value_counts().index.tolist()
    except Exception:
        cat_counts = sorted(ctx.id2name.keys())

    knobs = dict(
        k_region=settings.K_REGION,
        env_gain=settings.ENV_GAIN,
        env_gamma=settings.ENV_GAMMA,
        neighbor_expand=settings.NEIGHBOR_EXPAND,
        k_same=settings.K_SAME,
        k_mix=settings.K_MIX,
        edge_gain=settings.EDGE_GAIN,
        max_sub_nodes=settings.MAX_SUB_NODES,
    )

    preds = []; skipped = 0; reasons = {}
    for cid in cat_counts:
        try:
            pred = predict_hazards_at_location(ctx, lat, lon, int(cid), knobs)
            preds.append({"cid": int(cid), "name": ctx.id2name.get(int(cid), str(cid)), "pred": pred})
        except Exception as e:
            skipped += 1
            msg = str(e).split("\n",1)[0]; reasons[msg] = reasons.get(msg,0)+1
            continue

    if skipped:
        log(f"[RECO] candidates={len(cat_counts)} ok={len(preds)} skipped={skipped} reasons={sorted(reasons.items(), key=lambda x:-x[1])[:3]}")
    else:
        log(f"[RECO] candidates={len(cat_counts)} ok={len(preds)} skipped=0")

    preds.sort(key=lambda r: r["pred"]["failure"][4])

    out=[]
    for rank, r in enumerate(preds[:top_k], 1):
        cid=r["cid"]; name=r["name"]; pred=r["pred"]
        try:
            exp = explain_at_location(ctx, lat, lon, cid, target_year=None,
                                      subgraph_builder=build_augmented_subgraph_for_category, knobs=knobs)
            txt = llm_explain(settings, lat, lon, cid, name, pred, exp)  # ← 실패해도 내부 템플릿으로 자동 폴백
        except Exception as _:
            # explain_at_location 자체가 실패한 경우에만 아주 짧은 템플릿
            txt = "인근 지역의 대중교통/교육/거주·직장 인구 등 상권 특성을 종합해 산출한 위험 추정치입니다."
        f = pred["failure"]
        out.append({
            "rank":rank, "category":name,
            "1":round(f[0]*100,2), "2":round(f[1]*100,2), "3":round(f[2]*100,2), "4":round(f[3]*100,2), "5":round(f[4]*100,2),
            "explain":txt
        })
    return out
