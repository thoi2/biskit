import json
import numpy as np
import pandas as pd
import torch
from pathlib import Path
from typing import Dict, Optional, Tuple
from scipy.spatial import cKDTree

from torch_geometric.data import Data
from torch_geometric.nn import SAGEConv

from app.core.config import settings

class GraphSAGE(torch.nn.Module):
    def __init__(self, input_dim, hidden_dim=64, output_dim=1):
        super().__init__()
        self.conv1 = SAGEConv(input_dim, hidden_dim)
        self.conv2 = SAGEConv(hidden_dim, hidden_dim)
        self.fc    = torch.nn.Linear(hidden_dim, output_dim)
    def forward(self, x, edge_index):
        h = self.conv1(x, edge_index); h = torch.relu(h)
        h = self.conv2(h, edge_index); h = torch.relu(h)
        return self.fc(h).squeeze(-1)

class Artifacts:
    def __init__(self):
        self.meta: Dict = {}
        self.region_codes: list[int] = []
        self.region_index_map: Dict[int,int] = {}

        self.env_feat_count: int = 0
        self.feature_dim: int = 0

        self.id2name: Dict[int,str] = {}
        self.cat_ids_unique: list[int] = []
        self.cat_index_map: Dict[int,int] = {}

        # memory-mapped arrays
        self.x_mm: Optional[np.memmap] = None     # [N_nodes, feature_dim]
        self.y_mm: Optional[np.memmap] = None     # optional
        self.coords_mm: Optional[np.memmap] = None# optional

        # torch model
        self.model: Optional[torch.nn.Module] = None

        # optional structures
        self.support_map: Dict[Tuple[int,int], int] = {}
        self.region_kd: Optional[cKDTree] = None
        self.region_kd_codes: Optional[np.ndarray] = None

    def _load_json(self, path: Path):
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def load_all(self):
        d = Path(settings.DATA_DIR)
        # 1) meta
        self.meta = self._load_json(d / "reco_meta.json")
        self.region_codes = [int(c) for c in self.meta["region_codes"]]
        self.region_index_map = {code:i for i,code in enumerate(self.region_codes)}
        self.env_feat_count = int(self.meta["env_feat_count"])
        self.feature_dim = int(self.meta["feature_dim"])

        # 2) categories
        m = self._load_json(d / "cat_id2name_reco.json")
        id2name_raw = m["id2name"]
        self.id2name = {int(k): str(v) for k,v in id2name_raw.items()}
        self.cat_ids_unique = sorted(self.id2name.keys())
        self.cat_index_map = {cid:i for i,cid in enumerate(self.cat_ids_unique)}

        # 3) model
        self.model = GraphSAGE(self.feature_dim, 64, 1)
        self.model.load_state_dict(torch.load(d / "model_sage_q2_2025.pt", map_location="cpu"))
        self.model.eval()

        # 4) memmap x (노드 특징)
        #   read-only mmap → RAM을 거의 안 쓰고 행 단위 슬라이싱 가능
        self.x_mm = np.load(d / "x_reco.npy", mmap_mode="r")

        # 5) optional RC/KNN 자료
        if settings.ENABLE_RC and (d / "support_by_region_cat.parquet").exists():
            supp = pd.read_parquet(d / "support_by_region_cat.parquet")
            self.support_map = {(int(r), int(c)): int(s) for r,c,s in supp[["region_code","category_id","support"]].itertuples(index=False, name=None)}
        if settings.ENABLE_KNN and (d / "coords_reco.npy").exists():
            self.coords_mm = np.load(d / "coords_reco.npy", mmap_mode="r")
        if settings.ENABLE_KNN and (d / "y_reco.npy").exists():
            self.y_mm = np.load(d / "y_reco.npy", mmap_mode="r")

        # 6) region KD-tree (CROSSWALK가 있으면 사용)
        cross = d / "CROSSWALK.csv"
        if cross.exists():
            df = pd.read_csv(cross, low_memory=False)
            # lat/lon/code 추정 (간단 규칙)
            lat_cands = [c for c in df.columns if "lat" in c.lower() or "위도" in c]
            lon_cands = [c for c in df.columns if "lon" in c.lower() or "경도" in c]
            code_cands= [c for c in df.columns if "동코드" in c or "dong_code" in c.lower()]
            if lat_cands and lon_cands and code_cands:
                lat_col, lon_col, code_col = lat_cands[0], lon_cands[0], code_cands[0]
                sub = df[[lat_col, lon_col, code_col]].dropna()
                self.region_kd = cKDTree(sub[[lat_col, lon_col]].to_numpy())
                self.region_kd_codes = sub[code_col].to_numpy(dtype=int)

ART = Artifacts()
