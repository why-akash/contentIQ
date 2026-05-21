from fastapi import (
    APIRouter
)

from app.models.chat_model import (
    ChatRequest
)

from app.rag.retrieval import (
    RetrievalService
)

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)


@router.post("/")
async def chat(
    request: ChatRequest
):

    retrieval_service = (
        RetrievalService()
    )

    answer = (
        retrieval_service
        .ask_question(
            session_id=
            request.session_id,

            question=
            request.question
        )
    )

    return {
        "answer":
        answer
    }