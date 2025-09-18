from pydantic import BaseModel, Field, confloat
from typing import Dict
from datetime import datetime

class SingleRequest(BaseModel):
    lat: confloat(ge=-90, le=90) = Field(..., description="위도")
    lng: confloat(ge=-180, le=180) = Field(..., description="경도")
    top_k: int = Field(100, ge=1, le=200, description="상위 반환 개수")
    min_support: int = Field(20, ge=0, description="최소 지원수")

class SuccessResponse(BaseModel):
    lat: float
    lng: float
    success: bool = True
    status: int = 200
    data: Dict[str, float]

class ErrorContent(BaseModel):
    code: str = "ERROR"
    message: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

class ErrorBody(BaseModel):
    error: ErrorContent

class ErrorResponse(BaseModel):
    success: bool = False
    status: int
    body: ErrorBody

class BulkRequest(BaseModel):
    pass

class BulkResponse(BaseModel):
    pass