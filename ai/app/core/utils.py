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
