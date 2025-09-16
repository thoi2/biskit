from pydantic import BaseModel
from typing import Dict, List, Any

class Location(BaseModel):
    lat: float
    lng: float

class TopKRecommendationResponse(Location):
    data: Dict[str, Any]

class SingleCategoryRecommendationResponse(Location):
    data: Dict[str, Dict[str, int]]