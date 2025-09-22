import math
import numpy as np
import torch
from typing import Dict, Tuple, Optional
from torch_geometric.data import Data

from app.core.config import settings
from app.services.loaders import ART
from app.utils.geo import latlon_to_xy

def _fallback_pred(region_code: int, category_id: int) -> float:
    """2-노드(지역↔가상점포) 폴백 추론: edge_index 전체 없이도 동작"""
    r_idx = ART.region_index_map.get(region_code)
    if r_idx is None:
        return 0.0
    region_feat = torch.tensor(ART.x_mm[r_idx], dtype=torch.float32).unsqueeze(0)
    store_feat = torch.zeros((1, ART.feature_dim), dtype=torch.float32)
    cat_idx = ART.cat_index_map.get(int(category_id))
    if cat_idx is not None:
        store_feat[0, ART.env_feat_count + cat_idx] = 1.0
    x_pair = torch.cat([region_feat, store_feat], dim=0)
    ei = torch.tensor([[0,1],[1,0]], dtype=torch.long)
    with torch.no_grad():
        out = ART.model(x_pair, ei)
    pred = float(out[1].item())
    return max(0.0, pred)

def _support_weight(s: int, s0: int = 20) -> float:
    if s <= 0: return 0.0
    return 1.0 / (1.0 + math.exp(-(math.log1p(s) - math.log1p(s0))))

def _neighbor_weight(n: int, n0: int = 10) -> float:
    if n <= 0: return 0.0
    return min(1.0, n/(n0+1e-6))

def _hybrid(gnn_pred: float,
            rc_mean: Optional[float], rc_median: Optional[float], rc_count: int,
            knn_mean: Optional[float], knn_n: int,
            support: int,
            use_median: bool = True) -> float:
    base_val = rc_median if use_median else rc_mean
    w_gnn, w_base, w_knn = 0.50, 0.30, 0.20
    # RC/KNN 비활성 시 0 처리
    if not settings.ENABLE_RC:
        base_val, rc_count = None, 0
    if not settings.ENABLE_KNN:
        knn_mean, knn_n = None, 0

    # 동적 보정
    w_base *= _support_weight(support if support>0 else rc_count)
    w_knn  *= _neighbor_weight(knn_n)

    rest = 1.0 - (w_base if base_val is not None else 0.0) - (w_knn if knn_mean is not None else 0.0)
    w_gnn = max(0.40, min(0.70, rest if rest>0 else 0.50))
    total = w_gnn + (w_base if base_val is not None else 0.0) + (w_knn if knn_mean is not None else 0.0)
    if total > 0:
        w_gnn /= total
        if base_val is not None: w_base /= total
        if knn_mean is not None: w_knn  /= total

    out = w_gnn*gnn_pred
    if base_val is not None: out += w_base*base_val
    if knn_mean is not None: out += w_knn*knn_mean
    return max(0.0, float(out))

def _region_from_coord(lat: float, lon: float) -> int:
    if ART.region_kd is None or ART.region_kd_codes is None:
        # KD-tree가 없으면 meta의 region_codes 중 0번째로 폴백 (현실적으로는 400 에러가 낫지만 운영을 위해 폴백)
        return ART.region_codes[0]
    _, idx = ART.region_kd.query([lat, lon], k=1)
    return int(ART.region_kd_codes[idx])

def _knn_mean(lat: float, lon: float, category_id: int, radius_m: float) -> Tuple[Optional[float], int]:
    if ART.coords_mm is None or ART.y_mm is None:
        return None, 0
    x, y = latlon_to_xy(lat, lon)
    # 좌표 mm을 바로 KD-tree로 쓰지 않고, 근접 후보를 빠르게 찾는 구조가 없다면
    # 여기서는 간소화: 전수 검색은 불가 → KNN 비활성 권장
    # (25GB 환경에서는 Annoy/FAISS 등 외부 인덱스를 권장)
    return None, 0  # 안전하게 끔

def recommend(lat: float, lon: float, top_k: int, min_support: int):
    region_code = _region_from_coord(lat, lon)
    results = []
    for cid in ART.cat_ids_unique:
        supp = ART.support_map.get((region_code, int(cid)), 0) if settings.ENABLE_RC else min_support
        if supp < min_support:
            continue

        gnn_pred = _fallback_pred(region_code, int(cid))
        rc_mean = rc_median = None
        rc_count = 0
        knn_mean, knn_n = (None, 0)  # KNN 기본 OFF

        final = _hybrid(
            gnn_pred, rc_mean, rc_median, rc_count,
            knn_mean, knn_n, supp, use_median=True
        )
        results.append((ART.id2name.get(int(cid), str(cid)), final))

    results.sort(key=lambda x: x[1], reverse=True)
    top = results[:top_k]

    # 🔁 여기서 더 이상 int로 반올림하지 않고, 소수점 3자리까지로 제한만
    return {name: float(f"{val:.3f}") for name, val in top}
