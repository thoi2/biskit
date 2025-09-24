# app/core/settings.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # ===== 데이터 경로 =====
    DATA_DIR: str = "./data"
    MODEL_PATH: str = "survival_gnn.pt"
    META_PATH: str = "survival_meta.json"

    # ===== GNN / 추천 파라미터 =====
    K_REGION: int = 1
    ENV_GAIN: float = 5.0
    ENV_GAMMA: float = 2.0
    NEIGHBOR_EXPAND: bool = False
    K_SAME: int = 1
    K_MIX: int = 1
    EDGE_GAIN: int = 3
    MAX_SUB_NODES: int = 40000

    # ===== LLM / 게이트웨이 =====
    GMS_KEY: str | None = None
    GMS_BASE_URL: str = "https://gms.ssafy.io/gmsapi/api.openai.com/v1"
    LLM_ENABLE: bool = False
    LLM_MODEL: str = "gpt-5-nano"
    LLM_TIMEOUT: float = 120.0

    # ===== App =====
    APP_VERSION: str = "v1"
    LOG_LEVEL: str = "INFO"

    # 노트북 동일 파이프라인 스위치
    NOTEBOOK_PARITY: bool = True

    # ===== .env 로드 설정 (자동 로드) =====
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
