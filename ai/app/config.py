import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

def _env(name: str, default: str | None = None) -> str:
    v = os.getenv(name, default)
    if v is None:
        raise EnvironmentError(f"[config] Missing env: {name}")
    return v

@dataclass
class Settings:
    # files
    DATA_DIR: str = _env("DATA_DIR", ".")
    MODEL_PATH: str = os.getenv("MODEL_PATH") or "survival_gnn.pt"
    META_PATH: str = os.getenv("META_PATH") or "survival_meta.json"

    # gms / openai-compatible
    GMS_KEY: str = _env("GMS_KEY", "")
    GMS_BASE_URL: str = os.getenv("GMS_BASE_URL", "https://gms.ssafy.io/gmsapi/api.openai.com/v1")

    # app
    APP_VERSION: str = "v1"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # sensitivity knobs (노트북과 동일 기본값)
    K_REGION: int = int(os.getenv("K_REGION", "5"))
    ENV_GAIN: float = float(os.getenv("ENV_GAIN", "1.8"))
    ENV_GAMMA: float = float(os.getenv("ENV_GAMMA", "1.3"))
    NEIGHBOR_EXPAND: bool = os.getenv("NEIGHBOR_EXPAND", "true").lower() in ("1","true","yes")
    K_SAME: int = int(os.getenv("K_SAME", "48"))
    K_MIX: int = int(os.getenv("K_MIX", "48"))
    EDGE_GAIN: int = int(os.getenv("EDGE_GAIN", "3"))
    MAX_SUB_NODES: int = int(os.getenv("MAX_SUB_NODES", "40000"))

_settings: Settings | None = None

def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
        # resolve to DATA_DIR-relative paths
        if not os.path.isabs(_settings.MODEL_PATH):
            _settings.MODEL_PATH = os.path.join(_settings.DATA_DIR, _settings.MODEL_PATH)
        if not os.path.isabs(_settings.META_PATH):
            _settings.META_PATH = os.path.join(_settings.DATA_DIR, _settings.META_PATH)
    return _settings
