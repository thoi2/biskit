from .subgraph import predict_hazards_at_location
from .utils import log
import asyncio

async def analyze_all_categories_and_rank(ctx, settings, lat: float, lon: float):
    try:
        cat_counts = ctx.store_df["category_id"].value_counts().index.tolist()
    except Exception:
        cat_counts = sorted(ctx.id2name.keys())

    knobs = dict(
        k_region=5,  # 기존 20에서 5로 줄여 지역 민감도 높임
        env_gain=settings.ENV_GAIN,
        env_gamma=settings.ENV_GAMMA,
        neighbor_expand=settings.NEIGHBOR_EXPAND,
        k_same=settings.K_SAME,
        k_mix=settings.K_MIX,
        edge_gain=settings.EDGE_GAIN,
        max_sub_nodes=settings.MAX_SUB_NODES,
    )

    preds = []
    skipped = 0
    reasons = {}
    for cid in cat_counts:
        try:
            pred = await predict_hazards_at_location(ctx, lat, lon, int(cid), knobs)
            preds.append({"cid": int(cid), "name": ctx.id2name.get(int(cid), str(cid)), "pred": pred})
        except Exception as e:
            skipped += 1
            msg = str(e).split("\n", 1)[0]
            reasons[msg] = reasons.get(msg, 0) + 1
            continue

    if skipped:
        log(f"[LOC_NUM] candidates={len(cat_counts)} ok={len(preds)} skipped={skipped} reasons={sorted(reasons.items(), key=lambda x: -x[1])[:3]}")
    else:
        log(f"[LOC_NUM] candidates={len(cat_counts)} ok={len(preds)} skipped=0")

    # Rank based on 5th year failure rate
    preds.sort(key=lambda r: r["pred"]["failure"][4])

    out = []
    for rank, r in enumerate(preds, 1):
        cid = r["cid"]
        name = r["name"]
        pred = r["pred"]
        f = pred["failure"]
        out.append({
            "rank": rank,
            "category": name,
            "1": round(f[0] * 100, 2),
            "2": round(f[1] * 100, 2),
            "3": round(f[2] * 100, 2),
            "4": round(f[3] * 100, 2),
            "5": round(f[4] * 100, 2),
        })

    return out