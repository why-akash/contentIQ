import json
import os
import uuid

from fastapi import APIRouter, File, UploadFile

from app.services.upload_service import UploadService
from app.services.content_service import ContentService
from app.rag.ingestion import IngestionService

router = APIRouter(prefix="/upload", tags=["Upload"])

_CACHE_FILE = "app/data/upload_cache.json"


def _load_cache() -> dict:
    if os.path.exists(_CACHE_FILE):
        with open(_CACHE_FILE) as f:
            return json.load(f)
    return {}


def _save_cache(cache: dict):
    os.makedirs(os.path.dirname(_CACHE_FILE), exist_ok=True)
    with open(_CACHE_FILE, "w") as f:
        json.dump(cache, f)


@router.post("/process")
async def process_upload(file: UploadFile = File(...)):

    data = await file.read()
    filename = file.filename or "upload.mp4"

    file_id = UploadService.compute_hash(data)
    session_id = str(uuid.uuid4())

    cache = _load_cache()
    if file_id in cache:
        return {
            "session_id": session_id,
            "video_id": file_id,
            "summary": cache[file_id]["summary"],
            "status": "chat_ready",
        }

    transcript_data = UploadService.transcribe(data, filename)

    summary = ContentService.generate_summary(transcript_data["segments"])

    IngestionService().store_embeddings(
        transcript_segments=transcript_data["segments"],
        session_id=file_id,
        video_id=file_id,
    )

    cache[file_id] = {"summary": summary, "filename": filename}
    _save_cache(cache)

    return {
        "session_id": session_id,
        "video_id": file_id,
        "summary": summary,
        "status": "chat_ready",
    }
