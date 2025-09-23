import torch, torch.nn as nn, torch.nn.functional as F
from .utils import log

class SurvivalGNN(nn.Module):
    def __init__(self, in_dim, hid=64, out_hazards=5):
        super().__init__()
        from torch_geometric.nn import SAGEConv
        self.conv1 = SAGEConv(in_dim, hid)
        self.conv2 = SAGEConv(hid, hid)
        self.head = nn.Linear(hid, out_hazards)
    def forward(self, x, edge_index):
        h = self.conv1(x, edge_index); h = F.relu(h)
        h = self.conv2(h, edge_index); h = F.relu(h)
        logits = self.head(h)
        return logits, h

def load_model(ctx, meta_path: str, model_path: str):
    import json, os
    if not os.path.exists(meta_path):
        raise FileNotFoundError(f"meta not found: {meta_path}")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"model not found: {model_path}")
    with open(meta_path,"r",encoding="utf-8") as f:
        META = json.load(f)
    ctx.META = META
    H = len(META["year_bins"])
    in_dim = int(META["feature_dim"])
    model = SurvivalGNN(in_dim=in_dim, hid=64, out_hazards=H).to(ctx.device)
    state = torch.load(model_path, map_location=ctx.device)
    model.load_state_dict(state)
    model.eval()
    ctx.model = model
    log(f"model loaded: in_dim={in_dim} H={H}")
