from pydantic import BaseModel, Field, confloat
from typing import Dict

class SingleRequest(BaseModel):
    lat: confloat(ge=-90, le=90) = Field(..., description="위도")
    lng: confloat(ge=-180, le=180) = Field(..., description="경도")
    top_k: int = Field(100, ge=1, le=200, description="상위 반환 개수")
    min_support: int = Field(20, ge=0, description="최소 지원수")

class SingleResponse(BaseModel):
    lat: float
    lng: float
    data: Dict[str, float]  # 업종명 -> 예측 생존분기(실수)
