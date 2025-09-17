from fastapi import FastAPI
from app.api.routes import router as api_router
from app.services.loaders import ART

app = FastAPI(title="Survival-Quarter Recommender API", version="1.0")

@app.on_event("startup")
def _startup():
    # 25GB 환경 대비: 메모리맵 기반 최소 로딩만 수행
    ART.load_all()

app.include_router(api_router)
