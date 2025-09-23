from pydantic import BaseModel, Field

class SingleRequest(BaseModel):
    lat: float = Field(..., description="위도")
    lng: float = Field(..., description="경도")

class LocationNumRequest(BaseModel):
    building_id: int = Field(..., description="빌딩 ID")
    lat: float = Field(..., description="위도")
    lng: float = Field(..., description="경도")

class JobRequest(BaseModel):
    building_id: int = Field(..., description="빌딩 ID")
    lat: float = Field(..., description="위도")
    lng: float = Field(..., description="경도")
    category: str = Field(..., description="업종명")
