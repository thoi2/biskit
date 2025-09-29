import os, re, json
import numpy as np
import pandas as pd
import pandas.api.types
from scipy.spatial import cKDTree
from typing import Dict, Any

from .utils import log, _num, _choose, _read_csv_any

try:
    from pyproj import Transformer
    _HAS_PYPROJ = True
except Exception:
    _HAS_PYPROJ = False

from torch_geometric.data import Data
import torch


class Ctx:
    """런타임 전역 컨텍스트"""
    def __init__(self):
        # raw
        self.store_df: pd.DataFrame | None = None
        self.pop_df: pd.DataFrame | None = None
        self.cross: pd.DataFrame | None = None
        self.bus_df: pd.DataFrame | None = None
        self.lib_df: pd.DataFrame | None = None
        self.night_df: pd.DataFrame | None = None
        self.sch_df: pd.DataFrame | None = None
        self.sub_df: pd.DataFrame | None = None

        # env features
        self.env_feat_names = [
            "pop", "work_pop", "bus_stop_count", "school_count",
            "library_count", "nightview_count", "subway_traffic"
        ]
        self.region_env: Dict[int, Dict[str, float]] = {}
        self.region_max: Dict[str, float] = {k: 1.0 for k in self.env_feat_names}

        # graph / mapping
        self.region_codes: list[int] = []
        self.region_index_map: Dict[int, int] = {}
        self.category_ids: list[int] = []
        self.cat_index_map: Dict[int, int] = {}
        self.id2name: Dict[int, str] = {}

        # spatial
        self.node_tree: cKDTree | None = None
        self.node_codes: np.ndarray | None = None
        self.store_coords: np.ndarray | None = None
        self.store_tree: cKDTree | None = None
        self.store_coords: np.ndarray | None = None
        self.store_tree: cKDTree | None = None

        # graph data
        self.data: Data | None = None

        # meta & model (다른 모듈에서 로드)
        self.META: Dict[str, Any] | None = None
        self.model = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def _pack_cross(df, latn, lonn, dongn):
    if latn and lonn and dongn:
        lat = _num(df[latn]); lon = _num(df[lonn]); code = _num(df[dongn]).astype("Int64")
        ok = (
            np.isfinite(lat) & np.isfinite(lon) &
            lat.between(-90, 90) & lon.between(-180, 180) &
            code.notna()
        )
        if ok.any():
            return np.c_[lat[ok].to_numpy(), lon[ok].to_numpy(), code[ok].to_numpy().astype(np.int64)]
    return np.empty((0, 3), dtype=float)


def _guess_crs_from_series(lat_s, lon_s, name):
    latv = pd.to_numeric(lat_s, errors="coerce"); lonv = pd.to_numeric(lon_s, errors="coerce")
    latv = latv[np.isfinite(latv)]; lonv = lonv[np.isfinite(lonv)]
    if len(latv) == 0 or len(lonv) == 0:
        return "unknown"
    lat_min, lat_max = float(latv.min()), float(latv.max())
    lon_min, lon_max = float(lonv.min()), float(lonv.max())
    deg_like = (-90 <= lat_min <= 90 and -90 <= lat_max <= 90 and -180 <= lon_min <= 180 and -180 <= lon_max <= 180)
    korea_box = (30 <= lat_min <= 45 and 30 <= lat_max <= 45 and 120 <= lon_min <= 135 and 120 <= lon_max <= 135)
    return "EPSG:4326" if (deg_like and korea_box) else "EPSG:5186"


def _to_wgs84(lat_s, lon_s, src_crs):
    if (not _HAS_PYPROJ) or (src_crs == "unknown"):
        latv = pd.to_numeric(lat_s, errors="coerce").to_numpy()
        lonv = pd.to_numeric(lon_s, errors="coerce").to_numpy()
        ok = np.isfinite(latv) & np.isfinite(lonv)
        return latv[ok], lonv[ok], ok
    try:
        tr = Transformer.from_crs(src_crs, "EPSG:4326", always_xy=True)
    except Exception:
        tr = Transformer.from_crs("EPSG:5179", "EPSG:4326", always_xy=True)
    latv = pd.to_numeric(lat_s, errors="coerce").to_numpy()
    lonv = pd.to_numeric(lon_s, errors="coerce").to_numpy()
    ok = np.isfinite(latv) & np.isfinite(lonv)
    lon_w, lat_w = tr.transform(lonv[ok], latv[ok])  # (x,y)->(lon,lat)
    return np.array(lat_w), np.array(lon_w), ok


def _read_parquet_any(path, columns=None):
    try:
        df = pd.read_parquet(path, columns=columns)
        log(f"read {os.path.basename(path)} rows={len(df):,} cols={len(df.columns)}")
        return df
    except Exception as e:
        raise RuntimeError(f"Parquet 읽기 실패: {path}, 오류: {e}")

def load_data(ctx: Ctx, data_dir: str):
    DATA_FILES = {
        "STORE": os.path.join(data_dir, "STORE.parquet"),
        "POPULATION": os.path.join(data_dir, "POPULATION.parquet"),
        "CROSSWALK": os.path.join(data_dir, "CROSSWALK.parquet"),
        "INFRA_BUS": os.path.join(data_dir, "INFRA_BUS.parquet"),
        "LIBRARY": os.path.join(data_dir, "LIBRARY.parquet"),
        "NIGHTVIEW": os.path.join(data_dir, "NIGHTVIEW.parquet"),
        "SCHOOL": os.path.join(data_dir, "SCHOOL.parquet"),
        "SUBWAY": os.path.join(data_dir, "SUBWAY.parquet"),
    }

    # Columns identified from build_region_env_and_tree analysis
    STORE_COLS = [
        "행정동코드",
        "위도",
        "경도",
        "상권업종소분류코드",
        "상권업종소분류명",
        "상권업종대분류명",
        "상권업종중분류명",
    ]
    POPULATION_COLS = [
        "연도",
        "분기",
        "행정동_코드",
        "총_상주인구_수",
        "총_직장_인구_수_work",
        "남성_직장_인구_수_work",
        "여성_직장_인구_수_work",
        "연령대_10_직장_인구_수_work",
        "연령대_20_직장_인구_수_work",
        "연령대_30_직장_인구_수_work",
        "연령대_40_직장_인구_수_work",
        "연령대_50_직장_인구_수_work",
        "연령대_60_이상_직장_인구_수_work",
    ]
    CROSSWALK_COLS = [
        "start_lat",
        "start_lon",
        "end_lat",
        "end_lon",
        "읍면동코드",
    ]
    INFRA_COLS = [
        "위도",
        "경도",
    ]
    SUBWAY_COLS = [
        "역위도",
        "역경도",
        "지하철유동인구",
    ]

    ctx.store_df = _read_parquet_any(DATA_FILES["STORE"], columns=STORE_COLS)
    ctx.pop_df = _read_parquet_any(DATA_FILES["POPULATION"], columns=POPULATION_COLS)
    ctx.cross = _read_parquet_any(DATA_FILES["CROSSWALK"], columns=CROSSWALK_COLS)
    ctx.bus_df = _read_parquet_any(DATA_FILES["INFRA_BUS"], columns=INFRA_COLS)
    ctx.lib_df = _read_parquet_any(DATA_FILES["LIBRARY"], columns=INFRA_COLS) # Same columns as other infra
    ctx.night_df = _read_parquet_any(DATA_FILES["NIGHTVIEW"], columns=INFRA_COLS) # Same columns as other infra
    ctx.sch_df = _read_parquet_any(DATA_FILES["SCHOOL"], columns=INFRA_COLS) # Same columns as other infra
    ctx.sub_df = _read_parquet_any(DATA_FILES["SUBWAY"], columns=SUBWAY_COLS)


def build_region_env_and_tree(ctx: Ctx):
    store_df = ctx.store_df
    cross = ctx.cross

    # --- STORE: region_code & lat/lon ---
    reg_col = _choose(store_df, ["region_code", "행정동코드", "행정동_코드", "dong_code"])
    if reg_col is None:
        raise ValueError("STORE.csv에 행정동 코드 컬럼 필요")
    store_df["region_code"] = _num(store_df[reg_col]).astype("Int64")

    lat_col = _choose(store_df, ["위도", "lat", "Latitude", "LAT"])
    lon_col = _choose(store_df, ["경도", "lon", "Longitude", "LON"])
    has_latlon = (lat_col is not None) and (lon_col is not None)
    if has_latlon:
        store_df["_lat"] = _num(store_df[lat_col])
        store_df["_lon"] = _num(store_df[lon_col])

    # --- CROSSWALK → 지역 포인트 + KDTree ---
    s_lat = _choose(cross, ["start_lat", "위도", "lat", "Latitude"])
    s_lon = _choose(cross, ["start_lon", "경도", "lon", "Longitude"])
    e_lat = _choose(cross, ["end_lat"])
    e_lon = _choose(cross, ["end_lon"])
    dong_col_cross = _choose(cross, ["읍면동코드", "행정동코드", "행정동_코드", "dong_code", "region_code"])

    pts = []
    pts.append(_pack_cross(cross, s_lat, s_lon, dong_col_cross))
    pts.append(_pack_cross(cross, e_lat, e_lon, dong_col_cross))
    valid = [p for p in pts if p.size > 0]
    if not valid:
        log("[DEBUG] CROSSWALK columns: " + ", ".join(list(cross.columns)[:20]))
        raise ValueError("CROSSWALK에서 유효 포인트 없음")

    arr = np.unique(np.vstack(valid), axis=0)
    node_coords = arr[:, :2]
    node_codes = arr[:, 2].astype(np.int64)
    ctx.node_tree = cKDTree(node_coords)
    ctx.node_codes = node_codes

    # --- region_code 근접 보정 (유효 좌표만) ---
    if has_latlon:
        latv = store_df["_lat"]
        lonv = store_df["_lon"]
        ok = (
            np.isfinite(latv) & np.isfinite(lonv) &
            latv.between(-90, 90) & lonv.between(-180, 180)
        )
        log(f"[C2] STORE 좌표 유효 비율: {ok.sum()}/{len(store_df)}")
        if ok.any():
            store_coords = store_df.loc[ok, ["_lat", "_lon"]].to_numpy()
            _, idxs = ctx.node_tree.query(store_coords, k=1, workers=-1)
            mapped_codes = pd.Series(ctx.node_codes[idxs], index=store_df.index[ok], dtype="Int64")
            store_df.loc[ok, "region_code"] = mapped_codes
        else:
            log("[C2] STORE: 유효 좌표가 없어 KDTree 매칭을 생략합니다.")

        # [BUGFIX] Filter out stores with invalid coordinates to prevent KDTree error
        log(f"Filtering {len(store_df) - ok.sum()} stores with invalid coordinates.")
        store_df = store_df[ok].copy()

    # --- POP 최신 스냅샷 집계 ---
    pop_df = ctx.pop_df
    ycol = _choose(pop_df, ["연도", "기준연도"])
    qcol = _choose(pop_df, ["분기"])
    pop_ref = pop_df.copy()
    if ycol:
        y_max = int(_num(pop_df[ycol]).max())
        pop_ref = pop_df[_num(pop_df[ycol]) == y_max]
        if qcol and (qcol in pop_ref.columns):
            q_max = int(_num(pop_ref[qcol]).max())
            pop_ref = pop_ref[_num(pop_ref[qcol]) == q_max]

    pop_code_col = _choose(pop_ref, ["행정동_코드", "행정동코드", "dong_code", "region_code"])
    pop_col = _choose(pop_ref, ["총_상주인구_수"])
    work_pop_col = _choose(pop_ref, ["총_직장_인구_수_work"])

    if pop_code_col is None:
        raise ValueError("POPULATION 데이터에 행정동 코드 컬럼이 없습니다.")

    # Ensure numeric types
    pop_ref["pop_val"] = _num(pop_ref[pop_col]) if pop_col else 0.0
    if work_pop_col:
        pop_ref["work_pop_val"] = _num(pop_ref[work_pop_col])
    else:
        # Sum all columns ending with '_work' if '총_직장_인구_수_work' is not found
        work_cols = [c for c in pop_ref.columns if str(c).endswith("_work")]
        if work_cols:
            pop_ref["work_pop_val"] = pop_ref[work_cols].apply(_num).sum(axis=1)
        else:
            pop_ref["work_pop_val"] = 0.0

    pop_agg = pop_ref.groupby(pop_code_col).agg(
        pop=("pop_val", "sum"),
        work_pop=("work_pop_val", "sum")
    ).reset_index()
    pop_agg = pop_agg.rename(columns={pop_code_col: "code"})

    # region_env seed
    ctx.region_env = {
        int(r["code"]): {"pop": float(r["pop"]), "work_pop": float(r["work_pop"])}
        for _, r in pop_agg.iterrows()
    }

    # region_env seed
    ctx.region_env = {
        int(c): {"pop": float(v["pop"]), "work_pop": float(v["work_pop"])}
        for c, v in pop_agg.to_dict("index").items()
    }

    # --- 기타 인프라 비누적 카운트 ---
    def _count(df, label):
        latn = _choose(df, ["위도", "lat", "Latitude", "Y", "좌표Y", "tm_y"])
        lonn = _choose(df, ["경도", "lon", "Longitude", "X", "좌표X", "tm_x"])
        if not latn or not lonn:
            return {}
        src = _guess_crs_from_series(df[latn], df[lonn], label)
        lat_w, lon_w, ok_mask = _to_wgs84(df[latn], df[lonn], src)
        ok2 = (
            np.isfinite(lat_w) & np.isfinite(lon_w) &
            (lat_w >= -90) & (lat_w <= 90) & (lon_w >= -180) & (lon_w <= 180)
        )
        if ok2.sum() == 0:
            return {}
        pts = np.c_[lat_w[ok2], lon_w[ok2]]
        _, idx = ctx.node_tree.query(pts, k=1, workers=-1)
        codes = ctx.node_codes[idx]
        vc = pd.Series(codes).value_counts()
        return {int(k): int(v) for k, v in vc.items()}

    for label, df in [("BUS", ctx.bus_df), ("LIB", ctx.lib_df), ("SCH", ctx.sch_df), ("NIGHT", ctx.night_df)]:
        cnt = _count(df, label)
        key = dict(BUS="bus_stop_count", LIB="library_count", SCH="school_count", NIGHT="nightview_count")[label]
        for c, v in cnt.items():
            ctx.region_env.setdefault(int(c), {})[key] = float(v)

    # SUBWAY: 유동합 또는 역 개수
    sub = ctx.sub_df
    if sub is not None and len(sub):
        sat = _choose(sub, ["역위도", "위도", "lat", "Latitude", "Y", "tm_y"])
        son = _choose(sub, ["역경도", "경도", "lon", "Longitude", "X", "tm_x"])
        if sat and son:
            src = _guess_crs_from_series(sub[sat], sub[son], "SUBWAY")
            lat_w, lon_w, ok_mask = _to_wgs84(sub[sat], sub[son], src)
            ok2 = np.isfinite(lat_w) & np.isfinite(lon_w)
            if ok2.sum() > 0:
                pts = np.c_[lat_w[ok2], lon_w[ok2]]
                _, idx = ctx.node_tree.query(pts, k=1, workers=-1)
                codes = ctx.node_codes[idx]
                fcol = _choose(sub, ["지하철유동인구", "유동인구", "flow", "station_flow"])
                if fcol:
                    vals = _num(sub.loc[ok_mask, fcol]).fillna(0).to_numpy()[ok2]
                    agg = pd.DataFrame({"code": codes, "val": vals}).groupby("code")["val"].sum()
                    for code, v in agg.items():
                        ctx.region_env.setdefault(int(code), {})["subway_traffic"] = float(v)
                else:
                    vc = pd.Series(codes).value_counts()
                    for code, v in vc.items():
                        ctx.region_env.setdefault(int(code), {})["subway_traffic"] = float(v)

    # --- 누락 0 채움 + 스케일 기준 ---
    for c, d in ctx.region_env.items():
        for k in ctx.env_feat_names:
            d.setdefault(k, 0.0)
    for k in ctx.env_feat_names:
        ctx.region_max[k] = max(1.0, max(float(d.get(k, 0.0)) for d in ctx.region_env.values()))

    log(f"region_env ready: regions={len(ctx.region_env):,}")

    # ===================== 핵심 패치 =====================
    # KDTree의 모든 지역코드를 region_env에 강제 포함(0 피처)
    # → KDTree가 반환한 코드가 그래프 지역노드에 반드시 존재
    all_codes = set(int(c) for c in ctx.region_env.keys())
    for c in np.unique(ctx.node_codes):
        ci = int(c)
        if ci not in all_codes:
            ctx.region_env[ci] = {k: 0.0 for k in ctx.env_feat_names}
    # =====================================================

    # --- 카테고리 정규화 ---
    cat_code_col = _choose(store_df, [
        "상권업종소분류코드", "업종소분류코드", "서비스업종코드",
        "업종코드", "업종_ID", "업종id", "소분류코드", "category_code"
    ])
    cat_name_col = _choose(store_df, [
        "상권업종소분류명", "업종소분류명", "업종명", "소분류명", "업종_명", "category_name"
    ])
    big_col = _choose(store_df, ["상권업종대분류명", "업종대분류명"])
    mid_col = _choose(store_df, ["상권업종중분류명", "업종중분류명"])
    sml_col = _choose(store_df, ["상권업종소분류명", "업종소분류명", "업종명", "소분류명"])

    if cat_name_col:
        store_df["category_name"] = store_df[cat_name_col].astype(str)
    elif all([big_col, mid_col, sml_col]):
        store_df["category_name"] = store_df[big_col].astype(str) + "_" + store_df[mid_col].astype(str) + "_" + store_df[sml_col].astype(str)
    else:
        store_df["category_name"] = "UNKNOWN"

    # FutureWarning 대응: errors="coerce"
    tmp = pd.to_numeric(store_df[cat_code_col], errors="coerce") if cat_code_col else None
    if (tmp is not None) and pd.api.types.is_numeric_dtype(tmp.dtype):
        need_name = tmp.isna()
        if need_name.any():
            codes, _ = pd.factorize(store_df.loc[need_name, "category_name"].astype(str), sort=True)
            store_df.loc[~need_name, "category_id"] = tmp[~need_name].astype("int64")
            store_df.loc[need_name, "category_id"] = (-1 - codes).astype("int64")
        else:
            store_df["category_id"] = tmp.astype("int64")
    else:
        codes, _ = pd.factorize(store_df["category_name"].astype(str), sort=True)
        store_df["category_id"] = codes.astype("int64")

    ctx.id2name = store_df.groupby("category_id")["category_name"].first().to_dict()

    # --- 그래프 구성 (region 노드 + 점포 노드) ---
    ctx.region_codes = sorted({int(c) for c in ctx.region_env.keys()})
    ctx.region_index_map = {code: i for i, code in enumerate(ctx.region_codes)}

    ctx.category_ids = sorted(store_df["category_id"].unique().tolist())
    ctx.cat_index_map = {cid: i for i, cid in enumerate(ctx.category_ids)}

    env_feat_count = len(ctx.env_feat_names)
    num_cats = len(ctx.category_ids)
    feature_dim = env_feat_count + num_cats

    # 지역 노드 피처
    region_features = {}
    for code in ctx.region_codes:
        vec = np.zeros(feature_dim, dtype=np.float32)
        feats = ctx.region_env.get(code, {})
        for j, f in enumerate(ctx.env_feat_names):
            vec[j] = float(feats.get(f, 0.0)) / (ctx.region_max.get(f, 1.0) or 1.0)
        region_features[code] = vec

    num_region_nodes = len(ctx.region_codes)
    store_df_reset = store_df.reset_index(drop=True)

    # --- Store KDTree 생성 (메모리 문제 해결용) ---
    # 거대 그래프/피처 생성 전에 KDTree를 미리 만들어 메모리 공유 문제 방지
    log("[INFO] Creating store KDTree ahead of large tensors...")
    ctx.store_coords = store_df_reset[["_lat", "_lon"]].to_numpy(dtype=np.float16)
    ctx.store_tree = cKDTree(ctx.store_coords)
    log(f"[INFO] Store KDTree created with {len(ctx.store_coords)} points.")
    num_store_nodes = len(store_df_reset)
    total_nodes = num_region_nodes + num_store_nodes
    
    node_features = np.zeros((total_nodes, feature_dim), dtype=np.float16)
    edges_src, edges_dst = [], []

    # 1) 지역 노드 피처 채우기
    for i, code in enumerate(ctx.region_codes):
        node_features[i, :] = region_features[code].astype(np.float16)

    # 2) 점포 노드 피처 채우기 + region-edge 생성
    bad_region = 0
    skipped_na_region = 0
    
    store_node_offset = num_region_nodes
    
    for i, r in store_df_reset.iterrows():
        current_node_idx = store_node_offset + i

        # 점포 노드 특성 (one-hot)
        cid = int(r["category_id"])
        if cid in ctx.cat_index_map:
            cat_idx = env_feat_count + ctx.cat_index_map[cid]
            node_features[current_node_idx, cat_idx] = 1.0

        # region_code 유효성 검사 및 엣지 생성
        rcode_val = r.get("region_code")
        if pd.isna(rcode_val):
            skipped_na_region += 1
            continue

        rcode = int(rcode_val)
        if rcode in ctx.region_index_map:
            region_node_idx = ctx.region_index_map[rcode]
            edges_src.extend([current_node_idx, region_node_idx])
            edges_dst.extend([region_node_idx, current_node_idx])
        else:
            bad_region += 1

    log(f"[C4] store with NA region skipped={skipped_na_region:,} | region not mapped={bad_region:,}")

    # 텐서화
    x_tensor = torch.from_numpy(node_features)
    if len(edges_src) == 0:
        edge_index = torch.empty((2, 0), dtype=torch.long)
    else:
        edge_index = torch.tensor(np.vstack([edges_src, edges_dst]), dtype=torch.long)

    ctx.data = Data(x=x_tensor, edge_index=edge_index)
    log(f"graph ready: nodes={ctx.data.num_nodes:,} edges={edge_index.size(1):,} feat={feature_dim}")


def init_context(data_dir: str) -> Ctx:
    ctx = Ctx()
    load_data(ctx, data_dir)
    build_region_env_and_tree(ctx)
    # Release large DataFrames from memory after graph construction
    ctx.store_df = None
    ctx.pop_df = None
    ctx.cross = None
    ctx.bus_df = None
    ctx.lib_df = None
    ctx.night_df = None
    ctx.sch_df = None
    ctx.sub_df = None
    return ctx
