import numpy as np
import torch
from torch_geometric.data import Data
from .utils import log, haversine_distance
from .data_io import Ctx
import pandas as pd

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
    
    max_dist = d.min() * k_max_ratio
    valid_indices = np.where(d <= max_dist)[0]
    d = d[valid_indices]
    idxs = idxs[valid_indices]

    w = 1.0 / (d + 1e-6)
    w /= w.sum()
    codes = [int(ctx.node_codes[j]) for j in np.atleast_1d(idxs)]
    return codes, w

def _region_vec_from_code(ctx: Ctx, code: int, feature_dim: int) -> np.ndarray:
    env_feat_count = len(ctx.env_feat_names)
    vec = np.zeros(feature_dim, dtype=np.float32)
    feats = ctx.region_env.get(int(code), {})
    for j, f in enumerate(ctx.env_feat_names):
        denom = ctx.region_max.get(f, 1.0) or 1.0
        vec[j] = float(feats.get(f, 0.0)) / denom
    return vec

def _ensure_feature_dim(x: torch.Tensor, target_dim: int) -> torch.Tensor:
    cur = x.size(1)
    if cur == target_dim:
        return x
    if cur < target_dim:
        pad = torch.zeros((x.size(0), target_dim - cur), dtype=x.dtype, device=x.device)
        return torch.cat([x, pad], dim=1)
    return x[:, :target_dim]

async def build_augmented_subgraph_for_category(ctx: Ctx, lat: float, lon: float, cid: int, knobs: dict):
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
    if ctx.META is None:
        raise RuntimeError("META not loaded; cannot know feature_dim")
    target_dim = int(ctx.META["feature_dim"])
    num_cats_meta = int(ctx.META.get("num_cats", target_dim - env_feat_count))

    reg_X = []
    for rc in codes:
        reg_X.append(_region_vec_from_code(ctx, rc, target_dim))
    reg_X = np.vstack(reg_X).astype(np.float32)

    # 가상 노드 X (env는 가중합)
    env_gain = float(knobs.get("env_gain", 1.0))
    env_gamma = float(knobs.get("env_gamma", 1.0))
    env_mix = np.zeros(env_feat_count, np.float32)
    for rc, wj in zip(codes, w):
        env_mix += wj * _region_vec_from_code(ctx, rc, target_dim)[:env_feat_count]

    # ==================== 경쟁 점수 직접 주입 (수정된 부분) ====================
    try:
        # 1. Find nearby stores using the store_tree (KDTree)
        # Radius is approx 300m; 1 degree lat is approx 111.1 km
        radius_deg = 0.3 / 111.1
        nearby_store_indices = ctx.store_tree.query_ball_point([lat, lon], r=radius_deg)

        competition_score = 0.0
        if len(nearby_store_indices) > 0:
            # 2. Get coordinates and calculate distance/weights
            nearby_coords = ctx.store_coords[nearby_store_indices]
            distances_km = haversine_distance(lat, lon, nearby_coords[:, 0], nearby_coords[:, 1])
            
            # 3. Apply Gaussian weighting
            sigma = float(knobs.get("DISTANCE_SIGMA_KM", 0.1))
            weights = np.exp(-(distances_km**2) / (2 * sigma**2))
            competition_score = np.sum(weights)

        # 4. Normalize and inject the score
        # The score represents local competition density. Higher is "worse" for survival.
        # We transform it so that a higher score results in a lower feature value.
        normalized_competition = 1.0 / (1.0 + 0.05 * competition_score)

        if 'nightview_count' in ctx.env_feat_names:
            night_idx = ctx.env_feat_names.index('nightview_count')
            original_val = env_mix[night_idx]
            env_mix[night_idx] = normalized_competition
            log(f"[COMPETITION] Score: {competition_score:.2f} -> Injected: {normalized_competition:.2f} (replaces {original_val:.2f})")
        else:
            log("[COMPETITION] 'nightview_count' not in features. Skipping replacement.")

    except Exception as e:
        log(f"[COMPETITION] Failed to inject competition score: {e}")
    # ========================================================================

    if env_gamma != 1.0:
        env_mix = np.power(np.clip(env_mix, 0.0, 1.0), env_gamma)
    if env_gain != 1.0:
        env_mix = np.clip(env_mix * env_gain, 0.0, 1.0)

    v = np.zeros(target_dim, np.float32)
    v[:env_feat_count] = env_mix
    j = ctx.cat_index_map.get(int(cid), None)
    if (j is not None) and (0 <= j < num_cats_meta):
        v[env_feat_count + j] = 1.0

    sub_x = torch.tensor(np.vstack([reg_X, v[None, :]]), dtype=torch.float16)
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
    if ctx.model is None or ctx.META is None:
        raise RuntimeError("model or META not loaded")

    sub, _ = await build_augmented_subgraph_for_category(ctx, lat, lon, int(cid), knobs)
    target_dim = int(ctx.META["feature_dim"])
    sub.x = _ensure_feature_dim(sub.x, target_dim)

    dev = ctx.device
    sub = sub.to(dev, non_blocking=True)
    ctx.model.eval()
    logits, _ = ctx.model(sub.x, sub.edge_index)
    haz = torch.sigmoid(logits[0]).detach().cpu().numpy()
    S, F = _hazard_to_survival_and_failure(haz)
    return {"hazard": haz.tolist(), "survival": S.tolist(), "failure": F.tolist()}
