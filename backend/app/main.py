from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.youtube import (
    router as youtube_router
)

from app.api.routes.chat import (
    router as chat_router
)

from app.api.routes.upload import (
    router as upload_router
)

from app.core.config import settings
from app.rag.vector_store import get_embedding_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm embedding model so first request doesn't pay the load cost
    print("[startup] pre-loading embedding model...")
    get_embedding_model()
    print("[startup] embedding model ready ✅")
    yield


app = FastAPI(title="ContentIQ API", lifespan=lifespan)

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

app.include_router(
    upload_router
)


@app.get("/")
def home():

    return {
        "message":
        "ContentIQ API Running"
    }