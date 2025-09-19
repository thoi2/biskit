from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.api.routes import router as api_router
from app.services.loaders import ART
from app.schemas.common import ErrorResponse, ErrorBody, ErrorContent
from datetime import datetime

app = FastAPI(title="Survival-Quarter Recommender API", version="1.0")

@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    error_messages = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error['loc'])
        message = error['msg']
        error_messages.append(f"Field '{field}': {message}")
    
    error_content = ErrorContent(
        code="UNPROCESSABLE_ENTITY",
        message=", ".join(error_messages)
    )
    error_body = ErrorBody(error=error_content)
    error_response_model = ErrorResponse(
        status=422,
        body=error_body
    )
    return JSONResponse(
        status_code=422,
        content=error_response_model.dict(),
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    error_code_map = {
        500: "INTERNAL_SERVER_ERROR",
        404: "NOT_FOUND",
        400: "BAD_REQUEST",
        422: "UNPROCESSABLE_ENTITY"
    }
    error_code = error_code_map.get(exc.status_code, "UNKNOWN_ERROR")

    error_content = ErrorContent(
        code=error_code,
        message=exc.detail
    )
    error_body = ErrorBody(error=error_content)
    error_response_model = ErrorResponse(
        status=exc.status_code,
        body=error_body
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response_model.dict(),
    )

@app.on_event("startup")
def _startup():
    ART.load_all()

app.include_router(api_router)