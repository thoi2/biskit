from fastapi import FastAPI
from .api.endpoints import recommendation_router

app = FastAPI()

app.include_router(recommendation_router.router)

@app.get('/')
def read_root():
    return {"message": "GNN-powered API is running."}