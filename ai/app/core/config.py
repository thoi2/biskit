import os

class Settings:
    DATA_DIR = os.getenv("DATA_DIR", "data")

    # 메모리 사용 전략
    ENABLE_RC = os.getenv("ENABLE_RC", "0") == "1"     # 지역×업종 통계 사용
    ENABLE_KNN = os.getenv("ENABLE_KNN", "0") == "1"   # 좌표 KNN 사용

    # 미니 그래프 폴백만으로도 동작 (기본)
    MIN_SUPPORT = int(os.getenv("MIN_SUPPORT", "20"))
    TOP_K_DEFAULT = int(os.getenv("TOP_K_DEFAULT", "100"))

    # KNN 반경 (meters)
    KNN_RADIUS_M = float(os.getenv("KNN_RADIUS_M", "300"))

settings = Settings()
