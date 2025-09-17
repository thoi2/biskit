from fastapi import APIRouter, HTTPException
from app.schemas.common import SingleRequest, SingleResponse
from app.services.loaders import ART
from app.services.recommender import recommend

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

@router.post("/single", response_model=SingleResponse)
def api_single(payload: SingleRequest):
    if ART.model is None or ART.x_mm is None:
        raise HTTPException(status_code=500, detail="Model or features not loaded.")

    data = recommend(
        lat=payload.lat,
        lon=payload.lng,
        top_k=payload.top_k,
        min_support=payload.min_support
    )
    return {"lat": payload.lat, "lng": payload.lng, "data": data}
