from fastapi import APIRouter, Depends
from ...schemas.recommendation_models import (
    Location,
    TopKRecommendationResponse,
    SingleCategoryRecommendationResponse,
)
from ...core.gnn_model import get_model

router = APIRouter(prefix='/recommendations')

@router.post('/top-k', response_model=TopKRecommendationResponse)
def get_top_k_recommendations(location: Location, model: dict = Depends(get_model)):
    # GNN 모델을 사용한 추론 로직을 여기에 구현
    return {
        'lat': location.lat,
        'lng': location.lng,
        'data': { 'category_id1': 10, 'category_id2': 8 }
    }

@router.post('/single-category', response_model=SingleCategoryRecommendationResponse)
def get_single_category_recommendations(location: Location, category_id: int, model: dict = Depends(get_model)):
    # GNN 모델을 사용한 추론 로직을 여기에 구현
    return {
        'lat': location.lat,
        'lng': location.lng,
        'data': { f'category_id{category_id}': { '1': 30, '2': 40, '3': 50, '4': 60, '5': 70 } }
    }