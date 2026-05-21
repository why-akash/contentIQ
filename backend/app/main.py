from fastapi import (
    FastAPI
)

from fastapi.middleware.cors import (
    CORSMiddleware
)

from app.api.routes.youtube import (
    router as youtube_router
)

from app.api.routes.chat import (
    router as chat_router
)

from app.core.config import (
    settings
)

app = FastAPI(
    title="ContentIQ API"
)

app.add_middleware(
    CORSMiddleware,

    allow_origins=settings.CORS_ORIGINS,

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(
    youtube_router
)

app.include_router(
    chat_router
)


@app.get("/")
def home():

    return {
        "message":
        "ContentIQ API Running"
    }