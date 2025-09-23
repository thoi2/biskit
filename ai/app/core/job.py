from .subgraph import predict_hazards_at_location
from .utils import log

def analyze_single_category(ctx, settings, lat: float, lon: float, category_name: str):
    # Create name -> id mapping on the fly
    name2id = {v: k for k, v in ctx.id2name.items()}
    cid = name2id.get(category_name)

    if cid is None:
        raise ValueError(f"Category '{category_name}' not found.")

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

    try:
        pred = predict_hazards_at_location(ctx, lat, lon, int(cid), knobs)
        f = pred["failure"]
        result = {
            "rank": 1,
            "category": category_name,
            "1": round(f[0] * 100, 2),
            "2": round(f[1] * 100, 2),
            "3": round(f[2] * 100, 2),
            "4": round(f[3] * 100, 2),
            "5": round(f[4] * 100, 2),
        }
        return [result]  # Return as a list as per response format
    except Exception as e:
        log(f"[JOB] Analysis failed for category '{category_name}': {e}")
        raise
