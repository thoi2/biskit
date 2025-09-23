import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .core.settings import settings
from .schemas.single import SingleRequest, LocationNumRequest, JobRequest
from .core.utils import now_iso_kst, log
from .core.data_io import init_context
from .core.model import load_model
from .core.recommend import recommend_topk_with_explanations
from .core.location import analyze_all_categories_and_rank
from .core.job import analyze_single_category
from .core.gms import get_llm_explanation_for_category

app = FastAPI(title="SurvivalReco API", version="1.0")

# CORS(로컬 테스트 편의)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

@app.on_event("startup")
def _startup():
    log(f"startup: DATA_DIR={settings.DATA_DIR}")
    ctx = init_context(settings.DATA_DIR)
    
    model_path = settings.MODEL_PATH
    if not os.path.isabs(model_path):
        model_path = os.path.join(settings.DATA_DIR, model_path)
    
    meta_path = settings.META_PATH
    if not os.path.isabs(meta_path):
        meta_path = os.path.join(settings.DATA_DIR, meta_path)

    load_model(ctx, meta_path, model_path)
    app.state.settings = settings
    app.state.ctx = ctx
    log("startup done")

@app.post("/api/v1/ai/single")
def single(req: SingleRequest):
    settings = app.state.settings
    ctx = app.state.ctx
    lat, lon = float(req.lat), float(req.lng)

    # building_id = 가장 가까운 region_code (요구 포맷에 맞춰 사용)
    try:
        d, idx = ctx.node_tree.query([lat, lon], k=1)
        building_id = int(ctx.node_codes[idx])
    except Exception:
        building_id = -1

    try:
        result = recommend_topk_with_explanations(ctx, settings, lat, lon, top_k=10)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"recommend failed: {e}")

    return {
        "building": {
            "building_id": building_id,
            "lat": lat,
            "lng": lon
        },
        "result": result,  # [{category, 1..5, explain} x 10]
        "meta": {
            "source": "AI",
            "version": settings.APP_VERSION,
            "last_at": now_iso_kst()
        }
    }

@app.post("/api/v1/ai/location")
def location_num(req: LocationNumRequest):
    settings = app.state.settings
    ctx = app.state.ctx
    lat, lon = float(req.lat), float(req.lng)

    try:
        result = analyze_all_categories_and_rank(ctx, settings, lat, lon)
    except Exception as e:
        return {
            "success": False,
            "status": 500,
            "body": {
                "error": {
                    "code": "ANALYSIS_FAILED",
                    "message": f"Analysis failed: {e}",
                    "timestamp": now_iso_kst()
                }
            }
        }

    return {
        "success": True,
        "status": 200,
        "body": {
            "building_id": req.building_id,
            "lat": lat,
            "lng": lon,
            "data": result
        }
    }

@app.post("/api/v1/ai/job")
def job(req: JobRequest):
    settings = app.state.settings
    ctx = app.state.ctx
    lat, lon = float(req.lat), float(req.lng)

    try:
        result = analyze_single_category(ctx, settings, lat, lon, req.category)
    except Exception as e:
        return {
            "success": False,
            "status": 500,
            "body": {
                "error": {
                    "code": "ANALYSIS_FAILED",
                    "message": f"Analysis failed: {e}",
                    "timestamp": now_iso_kst()
                }
            }
        }

    return {
        "success": True,
        "status": 200,
        "body": {
            "building_id": req.building_id,
            "lat": lat,
            "lng": lon,
            "data": result
        }
    }

@app.post("/api/v1/ai/gms")
def gms(req: JobRequest):
    settings = app.state.settings
    ctx = app.state.ctx
    lat, lon = float(req.lat), float(req.lng)

    try:
        result = get_llm_explanation_for_category(ctx, settings, lat, lon, req.category)
    except Exception as e:
        return {
            "success": False,
            "status": 500,
            "body": {
                "error": {
                    "code": "ANALYSIS_FAILED",
                    "message": f"Analysis failed: {e}",
                    "timestamp": now_iso_kst()
                }
            }
        }

    return {
        "success": True,
        "status": 200,
        "body": {
            "building_id": req.building_id,
            "lat": lat,
            "lng": lon,
            "explain": result["explain"]
        }
    }
