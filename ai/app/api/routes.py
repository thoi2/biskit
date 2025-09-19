from fastapi import APIRouter, HTTPException
from app.schemas.common import SingleRequest, SuccessResponse
from app.services.loaders import ART
from app.services.recommender import recommend

router = APIRouter(prefix="/ai/v1", tags=["ai"])

@router.post("/recommend", response_model=SuccessResponse)
def api_single(payload: SingleRequest):
    if ART.model is None or ART.x_mm is None:
        raise HTTPException(status_code=500, detail="Model or features not loaded.")

    data = recommend(
        lat=payload.lat,
        lon=payload.lng,
        top_k=payload.top_k,
        min_support=payload.min_support
    )
    return {
        "lat": payload.lat,
        "lng": payload.lng,
        "success": True,
        "status": 200,
        "data": data
    }