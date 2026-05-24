import uuid
import json
import os
import asyncio

import httpx
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.youtube_model import YoutubeRequest
from app.services.transcript_service import TranscriptService
from app.services.content_service import ContentService
from app.rag.ingestion import IngestionService
from app.utils.youtube_utils import extract_video_id

router = APIRouter(prefix="/youtube", tags=["YouTube"])

_CACHE_FILE = "app/data/video_cache.json"

# In-memory job store: job_id → { status, session_id, video_id, summary, detail }
_jobs: dict = {}


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


async def _run_pipeline(job_id: str, video_id: str, youtube_url: str, title: str):
    try:
        loop = asyncio.get_event_loop()

        transcript_data = await asyncio.wait_for(
            loop.run_in_executor(None, TranscriptService.get_youtube_transcript, youtube_url),
            timeout=60,
        )

        summary = await asyncio.wait_for(
            loop.run_in_executor(None, ContentService.generate_summary, transcript_data["segments"]),
            timeout=90,
        )

        await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: IngestionService().store_embeddings(
                    transcript_segments=transcript_data["segments"],
                    session_id=transcript_data["video_id"],
                    video_id=transcript_data["video_id"]
                )
            ),
            timeout=60,
        )

        session_id = str(uuid.uuid4())

        # Update cache: mark as completed with summary
        cache = _load_cache()
        cache[video_id] = {"title": title, "status": "chat_ready", "summary": summary}
        _save_cache(cache)

        _jobs[job_id] = {
            "status": "chat_ready",
            "session_id": session_id,
            "video_id": video_id,
            "summary": summary,
        }

    except asyncio.TimeoutError:
        cache = _load_cache()
        if video_id in cache:
            cache[video_id]["status"] = "error"
            cache[video_id]["summary"] = None
            _save_cache(cache)
        _jobs[job_id] = {
            "status": "error",
            "detail": {"status": "timeout", "message": "Processing timed out. Try a shorter video or upload the file directly."}
        }
        print(f"[pipeline] ❌ timeout for job {job_id}")

    except HTTPException as e:
        cache = _load_cache()
        if video_id in cache:
            cache[video_id]["status"] = "error"
            cache[video_id]["summary"] = None
            _save_cache(cache)
        _jobs[job_id] = {"status": "error", "detail": e.detail}

    except Exception as e:
        cache = _load_cache()
        if video_id in cache:
            cache[video_id]["status"] = "error"
            cache[video_id]["summary"] = None
            _save_cache(cache)
        _jobs[job_id] = {
            "status": "error",
            "detail": {"status": "pipeline_error", "message": str(e)}
        }
        print(f"[pipeline] ❌ exception for job {job_id}: {e}")


@router.get("/history")
async def get_video_history():
    cache = _load_cache()
    return [
        {
            "video_id": vid,
            "title": data.get("title", vid),
            "summary": data.get("summary"),
            "status": data.get("status", "chat_ready"),
        }
        for vid, data in reversed(list(cache.items()))
    ]


@router.get("/status/{job_id}")
async def get_job_status(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(
            status_code=404,
            detail={"status": "not_found", "message": "Job not found."}
        )
    return job


@router.post("/process")
async def process_youtube(request: YoutubeRequest, background_tasks: BackgroundTasks):

    video_id = extract_video_id(request.youtube_url)
    cache = _load_cache()

    if video_id and video_id in cache:
        cached = cache[video_id]
        cached_status = cached.get("status", "chat_ready")

        # Still processing from a previous submission — check if job is alive
        if cached_status == "processing":
            job_id = cached.get("job_id")
            if job_id and job_id in _jobs:
                return {"status": "processing", "job_id": job_id}
            # Job lost (server restart) — fall through to reprocess

        # Completed cache hit
        elif cached_status == "chat_ready":
            return {
                "status": "chat_ready",
                "session_id": str(uuid.uuid4()),
                "video_id": video_id,
                "summary": cached["summary"],
            }

        # Previous attempt errored — fall through to retry

    # Fetch title upfront (fast) so it appears in history immediately
    title = await _fetch_video_title(video_id) if video_id else (video_id or "Unknown")

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {"status": "processing"}

    # Save pending entry to cache — shows up in history right away
    if video_id:
        cache[video_id] = {"title": title, "status": "processing", "summary": None, "job_id": job_id}
        _save_cache(cache)

    background_tasks.add_task(_run_pipeline, job_id, video_id or "", request.youtube_url, title)

    return {"status": "processing", "job_id": job_id}
