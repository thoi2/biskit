import os, json, time, pandas as pd, numpy as np

def log(msg: str):
    print(f"[AI] {msg}", flush=True)

def _num(s):
    return pd.to_numeric(s, errors="coerce")

def _choose(df: pd.DataFrame, cands):
    for c in cands:
        if (df is not None) and (c in df.columns):
            return c
    return None

def _read_csv_any(path, low_memory=False):
    for enc in [None, "utf-8", "cp949", "euc-kr"]:
        try:
            df = pd.read_csv(path, low_memory=low_memory, encoding=enc)
            log(f"read {os.path.basename(path)} rows={len(df):,} cols={len(df.columns)} enc={enc}")
            return df
        except Exception:
            continue
    raise RuntimeError(f"CSV 읽기 실패: {path}")

def now_iso_kst():
    # +09:00 표기
    from datetime import datetime, timezone, timedelta
    return datetime.now(tz=timezone(timedelta(hours=9))).isoformat()

def haversine_distance(lat1, lon1, lat2, lon2):
    """ 두 위경도 지점 간의 거리를 미터 단위로 계산 """
    R = 6371e3  # 지구 반지름 (미터)
    phi1 = np.radians(lat1)
    phi2 = np.radians(lat2)
    delta_phi = np.radians(lat2 - lat1)
    delta_lambda = np.radians(lon2 - lon1)

    a = np.sin(delta_phi / 2) * np.sin(delta_phi / 2) + \
        np.cos(phi1) * np.cos(phi2) * \
        np.sin(delta_lambda / 2) * np.sin(delta_lambda / 2)
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))

    return R * c
