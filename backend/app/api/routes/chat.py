from fastapi import APIRouter
from app.models.chat_model import ChatRequest
from app.rag.retrieval import RetrievalService

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/")
async def chat(request: ChatRequest):
    print(f"\n[chat] ── REQUEST ────────────────────────────────")
    print(f"[chat] session_id : {request.session_id}")
    print(f"[chat] video_id   : {request.video_id}")
    print(f"[chat] question   : {request.question[:120]}")

    retrieval_service = RetrievalService()

    answer = retrieval_service.ask_question(
        session_id=request.session_id,
        video_id=request.video_id,
        question=request.question
    )

    print(f"[chat] answer     : {str(answer)[:200]}")
    print(f"[chat] ── DONE ──────────────────────────────────\n")

    return {"answer": answer}
