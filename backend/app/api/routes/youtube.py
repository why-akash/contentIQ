import uuid
import json
import os
import asyncio

import httpx
from fastapi import APIRouter, HTTPException
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


async def _fetch_video_title(video_id: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                "https://www.youtube.com/oembed",
                params={"url": f"https://www.youtube.com/watch?v={video_id}", "format": "json"}
            )
            return resp.json().get("title", video_id)
    except Exception:
        return video_id


@router.get("/history")
async def get_video_history():
    cache = _load_cache()
    return [
        {
            "video_id": vid,
            "title": data.get("title", vid),
            "summary": data.get("summary", ""),
        }
        for vid, data in reversed(list(cache.items()))
    ]


@router.post("/process")
async def process_youtube(request: YoutubeRequest):

    video_id = extract_video_id(request.youtube_url)

    cache = _load_cache()

    session_id = str(uuid.uuid4())

    if video_id and video_id in cache:
        return {
            "session_id": session_id,
            "video_id": video_id,
            "summary": cache[video_id]["summary"],
            "status": "chat_ready"
        }

    try:
        loop = asyncio.get_event_loop()
        transcript_data = await asyncio.wait_for(
            loop.run_in_executor(None, TranscriptService.get_youtube_transcript, request.youtube_url),
            timeout=50,
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail={
                "status": "timeout",
                "message": "Transcript fetch timed out. Try a shorter video or upload the file directly."
            }
        )

    summary = ContentService.generate_summary(transcript_data["segments"])

    IngestionService().store_embeddings(
        transcript_segments=transcript_data["segments"],
        session_id=transcript_data["video_id"],
        video_id=transcript_data["video_id"]
    )

    if video_id:
        title = await _fetch_video_title(video_id)
        cache[video_id] = {"summary": summary, "title": title}
        _save_cache(cache)

    return {
        "session_id": session_id,
        "video_id": transcript_data["video_id"],
        "summary": summary,
        "status": "chat_ready"
    }
