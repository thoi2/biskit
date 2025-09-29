import time
from .subgraph import predict_hazards_at_location, build_augmented_subgraph_for_category
from .explain import explain_at_location, llm_explain
from .utils import log

async def get_llm_explanation_for_category(ctx, settings, lat: float, lon: float, category_name: str):
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

    start_time = time.time()
    log(f"[GMS] Starting explanation for {category_name} at ({lat}, {lon})")

    # 1. Predict hazards (the "location" way)
    pred_start = time.time()
    pred_result = await predict_hazards_at_location(ctx, lat, lon, int(cid), knobs)
    pred_end = time.time()
    log(f"[GMS] predict_hazards_at_location took {pred_end - pred_start:.4f} seconds")

    # 2. Get explanation data, re-using the prediction
    exp_start = time.time()
    hazard_list = pred_result.get("hazard", [])
    exp = await explain_at_location(
        ctx, lat, lon, cid,
        subgraph_builder=build_augmented_subgraph_for_category,
        knobs=knobs,
        hazard=hazard_list  # Pass the pre-computed hazard
    )
    exp_end = time.time()
    log(f"[GMS] explain_at_location (re-using pred) took {exp_end - exp_start:.4f} seconds")
    
    # 3. Get the LLM explanation
    llm_explain_start = time.time()
    # The llm_explain function expects the hazard list as its 'pred' argument
    explanation_text = await llm_explain(settings, lat, lon, cid, category_name, hazard_list, exp)
    llm_explain_end = time.time()
    log(f"[GMS] llm_explain took {llm_explain_end - llm_explain_start:.4f} seconds")

    end_time = time.time()
    log(f"[GMS] Total explanation for {category_name} took {end_time - start_time:.4f} seconds")

    return {
        "category_id": cid,
        "explain": explanation_text
    }
