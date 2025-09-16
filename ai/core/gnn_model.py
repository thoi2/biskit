import torch

# GNN 모델 클래스 (예시)
class MyGNNModel(torch.nn.Module):
    def __init__(self):
        super().__init__()
    def forward(self, x):
        return x

# 애플리케이션 시작 시 모델을 메모리에 로드
def load_gnn_model(model_path: str = 'models/trained_model.pt'):
    try:
        model = MyGNNModel()
        model.load_state_dict(torch.load(model_path))
        model.eval()
        return model
    except FileNotFoundError:
        print("Error: Model file not found.")
        return None

# 의존성 주입을 위한 함수
def get_model():
    return load_gnn_model()