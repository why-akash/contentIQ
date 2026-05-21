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

app = FastAPI(
    title="ContentIQ API"
)

# CORS
app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5173",

        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],

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