import json
import os
import uuid
import asyncio

from fastapi import APIRouter, File, UploadFile, BackgroundTasks, HTTPException

from app.services.upload_service import UploadService
from app.services.content_service import ContentService
from app.rag.ingestion import IngestionService

router = APIRouter(prefix="/upload", tags=["Upload"])

_CACHE_FILE = "app/data/upload_cache.json"

# In-memory job store: job_id → { status, session_id, video_id, summary, detail }
_upload_jobs: dict = {}


def _load_cache() -> dict:
    if os.path.exists(_CACHE_FILE):
        with open(_CACHE_FILE) as f:
            return json.load(f)
    return {}


def _save_cache(cache: dict):
    os.makedirs(os.path.dirname(_CACHE_FILE), exist_ok=True)
    with open(_CACHE_FILE, "w") as f:
        json.dump(cache, f)


async def _run_upload_pipeline(job_id: str, data: bytes, filename: str, file_id: str):
    print(f"\n{'='*50}")
    print(f"[upload-pipeline] START  job={job_id}  file={filename}")
    print(f"{'='*50}")

    def _update_cache_error():
        cache = _load_cache()
        if file_id in cache:
            cache[file_id]["status"] = "error"
            cache[file_id]["summary"] = None
            _save_cache(cache)

    try:
        loop = asyncio.get_event_loop()

        # ── Step 1: Transcription ────────────────────────────
        print(f"[upload-pipeline] step 1/3 — transcription  ({len(data) / (1024*1024):.2f} MB raw)")
        _upload_jobs[job_id]["step"] = 1  # "Transcribing audio"
        transcript_data = await asyncio.wait_for(
            loop.run_in_executor(None, UploadService.transcribe, data, filename),
            timeout=180,
        )
        print(f"[upload-pipeline] step 1/3 ✅ — {len(transcript_data['segments'])} segments")

        # ── Step 2: Summary ──────────────────────────────────
        print(f"[upload-pipeline] step 2/3 — summarization")
        _upload_jobs[job_id]["step"] = 2  # "Generating summary"
        summary = await asyncio.wait_for(
            loop.run_in_executor(None, ContentService.generate_summary, transcript_data["segments"]),
            timeout=90,
        )
        print(f"[upload-pipeline] step 2/3 ✅ — summary generated")

        # ── Step 3: Embeddings ───────────────────────────────
        print(f"[upload-pipeline] step 3/3 — embeddings + ChromaDB")
        _upload_jobs[job_id]["step"] = 3  # "Indexing for chat"
        await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: IngestionService().store_embeddings(
                    transcript_segments=transcript_data["segments"],
                    session_id=file_id,
                    video_id=file_id,
                )
            ),
            timeout=120,
        )
        print(f"[upload-pipeline] step 3/3 ✅ — embeddings stored")
        _upload_jobs[job_id]["step"] = 4  # "Almost ready…"

        # ── Done ─────────────────────────────────────────────
        session_id = str(uuid.uuid4())
        cache = _load_cache()
        cache[file_id] = {"filename": filename, "status": "chat_ready", "summary": summary}
        _save_cache(cache)

        _upload_jobs[job_id] = {
            "status": "chat_ready",
            "session_id": session_id,
            "video_id": file_id,
            "summary": summary,
        }
        print(f"[upload-pipeline] ✅ COMPLETE  job={job_id}\n{'='*50}\n")

    except asyncio.TimeoutError:
        _update_cache_error()
        _upload_jobs[job_id] = {
            "status": "error",
            "detail": {
                "status": "timeout",
                "message": "Processing timed out. Try a shorter file (under 45 minutes)."
            }
        }
        print(f"[upload-pipeline] ❌ TIMEOUT  job={job_id}\n{'='*50}\n")

    except HTTPException as e:
        _update_cache_error()
        _upload_jobs[job_id] = {"status": "error", "detail": e.detail}
        print(f"[upload-pipeline] ❌ HTTP ERROR  job={job_id}: {e.detail}\n{'='*50}\n")

    except Exception as e:
        _update_cache_error()
        _upload_jobs[job_id] = {
            "status": "error",
            "detail": {"status": "pipeline_error", "message": str(e)}
        }
        print(f"[upload-pipeline] ❌ EXCEPTION  job={job_id}: {e}\n{'='*50}\n")


@router.get("/status/{job_id}")
async def get_upload_job_status(job_id: str):
    job = _upload_jobs.get(job_id)
    if not job:
        raise HTTPException(
            status_code=404,
            detail={"status": "not_found", "message": "Job not found."}
        )
    return job


@router.post("/process")
async def process_upload(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    data = await file.read()
    filename = file.filename or "upload.mp4"

    print(f"\n[upload] received: {filename}  ({len(data) / (1024*1024):.2f} MB)")

    # Validate extension before doing anything else
    UploadService.validate_extension(filename)

    file_id = UploadService.compute_hash(data)
    session_id = str(uuid.uuid4())

    # Cache hit — return immediately
    cache = _load_cache()
    if file_id in cache and cache[file_id].get("status") == "chat_ready":
        print(f"[upload] cache hit for file_id={file_id}")
        return {
            "status": "chat_ready",
            "session_id": session_id,
            "video_id": file_id,
            "summary": cache[file_id]["summary"],
        }

    job_id = str(uuid.uuid4())
    _upload_jobs[job_id] = {"status": "processing", "step": 1}

    print(f"[upload] starting background pipeline  job={job_id}  file_id={file_id}")
    background_tasks.add_task(_run_upload_pipeline, job_id, data, filename, file_id)

    return {"status": "processing", "job_id": job_id}
