import hashlib
import os
import subprocess
import tempfile

from fastapi import HTTPException
from groq import Groq

from app.core.config import settings

_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm", ".mkv", ".m4v"}
_AUDIO_EXTENSIONS = {".mp3", ".m4a", ".wav", ".ogg", ".flac", ".aac"}
_ACCEPTED_EXTENSIONS = _VIDEO_EXTENSIONS | _AUDIO_EXTENSIONS


class UploadService:

    @staticmethod
    def compute_hash(data: bytes) -> str:
        return hashlib.sha256(data).hexdigest()[:16]

    @staticmethod
    def validate_extension(filename: str):
        ext = os.path.splitext(filename.lower())[1]
        if ext not in _ACCEPTED_EXTENSIONS:
            raise HTTPException(
                status_code=415,
                detail={
                    "status": "unsupported_type",
                    "message": (
                        f"Unsupported file type '{ext}'. "
                        "Accepted: MP4, MOV, AVI, WebM, MKV, MP3, M4A, WAV, OGG, FLAC"
                    )
                }
            )

    @staticmethod
    def _is_video(filename: str) -> bool:
        return os.path.splitext(filename.lower())[1] in _VIDEO_EXTENSIONS

    @staticmethod
    def _convert_to_mp3(input_path: str, output_path: str):
        result = subprocess.run(
            [
                "ffmpeg", "-y", "-i", input_path,
                "-vn", "-ab", "64k", "-ar", "44100", "-ac", "1",
                output_path,
            ],
            capture_output=True,
            timeout=300,
        )
        if result.returncode != 0:
            raise HTTPException(
                status_code=422,
                detail={
                    "status": "conversion_failed",
                    "message": "Could not convert video to audio. File may be corrupt or unsupported."
                }
            )

    @staticmethod
    def transcribe(data: bytes, filename: str) -> dict:
        UploadService.validate_extension(filename)

        raw_mb = len(data) / (1024 * 1024)
        is_video = UploadService._is_video(filename)
        kind = "video" if is_video else "audio"

        print(f"\n[upload] ── TRANSCRIPTION START ──────────────────────")
        print(f"[upload] file     : {filename}")
        print(f"[upload] type     : {kind}")
        print(f"[upload] raw size : {raw_mb:.2f} MB")

        with tempfile.TemporaryDirectory() as tmpdir:
            ext = os.path.splitext(filename.lower())[1] or ".mp4"
            original_path = os.path.join(tmpdir, f"input{ext}")

            with open(original_path, "wb") as f:
                f.write(data)

            print(f"[upload] written to temp: {original_path}")

            if is_video:
                print(f"[upload] converting video → mp3 at 64 kbps mono...")
                audio_path = os.path.join(tmpdir, "audio.mp3")
                UploadService._convert_to_mp3(original_path, audio_path)
                print(f"[upload] ffmpeg conversion complete")
            else:
                audio_path = original_path
                print(f"[upload] audio file — skipping ffmpeg conversion")

            file_size = os.path.getsize(audio_path)
            audio_mb = file_size / (1024 * 1024)
            print(f"[upload] audio size after conversion: {audio_mb:.2f} MB")

            if file_size > 24 * 1024 * 1024:
                print(f"[upload] ❌ audio too large ({audio_mb:.2f} MB > 24 MB limit)")
                raise HTTPException(
                    status_code=422,
                    detail={
                        "status": "file_too_large",
                        "message": "Audio exceeds 25 MB limit. Try a shorter recording (under ~45 minutes)."
                    }
                )

            print(f"[upload] sending to Groq Whisper (whisper-large-v3-turbo)...")

            try:
                client = Groq(api_key=settings.GROQ_API_KEY)
                with open(audio_path, "rb") as audio_file:
                    transcription = client.audio.transcriptions.create(
                        model="whisper-large-v3-turbo",
                        file=audio_file,
                        response_format="verbose_json",
                        timestamp_granularities=["segment"]
                    )
                print(f"[upload] Groq Whisper response received")
            except Exception as e:
                print(f"[upload] ❌ Groq Whisper failed: {e}")
                raise HTTPException(
                    status_code=500,
                    detail={
                        "status": "transcription_failed",
                        "message": "Whisper transcription failed."
                    }
                )

            segments = [
                {
                    "text": seg["text"] if isinstance(seg, dict) else seg.text,
                    "start": seg["start"] if isinstance(seg, dict) else seg.start,
                    "duration": (seg["end"] - seg["start"]) if isinstance(seg, dict) else (seg.end - seg.start),
                }
                for seg in transcription.segments
            ]

            print(f"[upload] ✅ {len(segments)} segments extracted")
            if segments:
                print(f"[upload] first segment: {segments[0]}")
            print(f"[upload] ── TRANSCRIPTION END ────────────────────────\n")

            return {
                "full_text": " ".join(seg["text"] for seg in segments),
                "segments": segments,
            }
