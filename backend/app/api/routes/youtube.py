import uuid
import json
import os

from fastapi import APIRouter
from app.models.youtube_model import YoutubeRequest
from app.services.transcript_service import TranscriptService
from app.services.content_service import ContentService
from app.rag.ingestion import IngestionService
from app.utils.youtube_utils import extract_video_id

router = APIRouter(prefix="/youtube", tags=["YouTube"])

_CACHE_FILE = "app/data/video_cache.json"


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
async def process_youtube(request: YoutubeRequest):

    video_id = extract_video_id(request.youtube_url)

    cache = _load_cache()

    session_id = str(uuid.uuid4())  # always new per user

    if video_id and video_id in cache:
        # embeddings already stored under video_id collection
        # just return fresh session_id + cached summary
        return {
            "session_id": session_id,
            "video_id": video_id,
            "summary": cache[video_id]["summary"],
            "status": "chat_ready"
        }

    if request.transcript_segments:
        transcript_data = {
            "video_id": video_id,
            "segments": [s.model_dump() for s in request.transcript_segments]
        }
    else:
        transcript_data = TranscriptService.get_youtube_transcript(request.youtube_url)

    summary = ContentService.generate_summary(transcript_data["segments"])

    # store embeddings under video_id (not session_id)
    # so all users share one collection per video
    IngestionService().store_embeddings(
        transcript_segments=transcript_data["segments"],
        session_id=transcript_data["video_id"],   # <-- video_id as collection name
        video_id=transcript_data["video_id"]
    )

    if video_id:
        cache[video_id] = {"summary": summary}
        _save_cache(cache)

    return {
        "session_id": session_id,
        "video_id": transcript_data["video_id"],
        "summary": summary,
        "status": "chat_ready"
    }
