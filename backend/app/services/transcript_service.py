import os
import tempfile
import httpx
import yt_dlp

from fastapi import HTTPException
from groq import Groq

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    IpBlocked,
    NoTranscriptFound,
    TranscriptsDisabled,
    RequestBlocked
)

from app.utils.youtube_utils import extract_video_id
from app.core.config import settings


class TranscriptService:

    @staticmethod
    def get_youtube_transcript(youtube_url: str):

        video_id = extract_video_id(youtube_url)

        if not video_id:
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "invalid_url",
                    "message": "Invalid YouTube URL."
                }
            )

        print(f"\n[transcript] video_id: {video_id}")
        print(f"[transcript] method: YouTube Transcript API")

        try:
            transcript = YouTubeTranscriptApi().fetch(video_id)

            segments = [
                {
                    "text": item.text,
                    "start": item.start,
                    "duration": item.duration
                }
                for item in transcript
            ]

            full_text = " ".join(item.text for item in transcript)

            print(f"[transcript] success — {len(segments)} segments\n")

            return {
                "video_id": video_id,
                "full_text": full_text,
                "segments": segments
            }

        except (IpBlocked, RequestBlocked, NoTranscriptFound, TranscriptsDisabled) as e:
            print(f"[transcript] {type(e).__name__} — trying Supadata fallback")
            return TranscriptService._supadata_fallback(video_id, youtube_url)

    @staticmethod
    def _supadata_fallback(video_id: str, youtube_url: str):

        print("\n========== SUPADATA FALLBACK ==========")

        if not settings.SUPADATA_API_KEY:
            print("[supadata] ❌ SUPADATA_API_KEY missing")
            print("[supadata] → switching to Whisper fallback\n")
            return TranscriptService._whisper_fallback(video_id, youtube_url)

        print(f"[supadata] video_id: {video_id}")
        print("[supadata] API key found")
        print("[supadata] sending request...")

        try:
            with httpx.Client(timeout=15) as client:

                resp = client.get(
                    "https://api.supadata.ai/v1/youtube/transcript",
                    params={
                        "videoId": video_id,
                        "text": "false"
                    },
                    headers={
                        "x-api-key": settings.SUPADATA_API_KEY
                    },
                )

            print(f"[supadata] status_code: {resp.status_code}")

            print(
                "[supadata] raw response preview:",
                resp.text[:500]
            )

            if resp.status_code == 404:
                print("[supadata] ❌ 404 no captions")
                print("[supadata] → switching to Whisper\n")
                return TranscriptService._whisper_fallback(
                    video_id,
                    youtube_url
                )

            if resp.status_code != 200:
                print(
                    f"[supadata] ❌ API error {resp.status_code}"
                )
                print("[supadata] → switching to Whisper\n")
                return TranscriptService._whisper_fallback(
                    video_id,
                    youtube_url
                )

            data = resp.json()

            print(
                "[supadata] json keys:",
                list(data.keys())
            )

            content = data.get("content", [])

            print(
                f"[supadata] content length: {len(content)}"
            )

            if content:
                print(
                    "[supadata] first item:",
                    content[0]
                )

            if not content:
                print("[supadata] ❌ empty content")
                print("[supadata] → switching to Whisper\n")
                return TranscriptService._whisper_fallback(
                    video_id,
                    youtube_url
                )

            segments = [
                {
                    "text": item["text"],
                    "start": item["offset"] / 1000,
                    "duration": item["duration"] / 1000,
                }
                for item in content
                if item.get("text")
            ]

            full_text = " ".join(
                seg["text"] for seg in segments
            )

            print(
                f"[supadata] ✅ success — {len(segments)} segments"
            )

            if segments:
                print(
                    "[supadata] first segment:",
                    segments[0]
                )

            print("====================================\n")

            return {
                "video_id": video_id,
                "full_text": full_text,
                "segments": segments
            }

        except Exception as e:
            print(f"[supadata] ❌ exception: {e}")
            print("[supadata] → switching to Whisper\n")

            return TranscriptService._whisper_fallback(
                video_id,
                youtube_url
            )
    
    @staticmethod
    def _whisper_fallback(video_id: str, youtube_url: str):

        print(f"[whisper] downloading audio for {video_id}...")

        with tempfile.TemporaryDirectory() as tmpdir:

            audio_path = os.path.join(tmpdir, video_id)

            ydl_opts = {
                "format": "bestaudio/best",
                "outtmpl": audio_path + ".%(ext)s",
                "quiet": True,
                "socket_timeout": 10,
                "retries": 1,
                "postprocessors": [{
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "64",
                }],
            }

            if settings.YOUTUBE_COOKIES:
                cookies_path = os.path.join(tmpdir, "cookies.txt")
                with open(cookies_path, "w") as f:
                    f.write(settings.YOUTUBE_COOKIES)
                ydl_opts["cookiefile"] = cookies_path
                print(f"[whisper] using cookies from YOUTUBE_COOKIES env var")

            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([youtube_url])

            except yt_dlp.utils.DownloadError as e:
                err = str(e).lower()
                if "sign in" in err or "bot" in err or "confirm" in err:
                    raise HTTPException(
                        status_code=422,
                        detail={
                            "status": "bot_detection",
                            "message": (
                                "YouTube is blocking audio download from this server. "
                                "Upload the video file directly instead."
                            )
                        }
                    )
                raise HTTPException(
                    status_code=422,
                    detail={
                        "status": "download_failed",
                        "message": "Could not download audio. Video may be private, unavailable, or a livestream."
                    }
                )

            downloaded_path = f"{audio_path}.mp3"

            file_size = os.path.getsize(downloaded_path)
            print(f"[whisper] audio size: {file_size / (1024 * 1024):.2f} MB")
            if file_size > 24 * 1024 * 1024:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "status": "file_too_large",
                        "message": "Audio exceeds 25 MB limit. Try a video under 45 minutes."
                    }
                )

            print(f"[whisper] transcribing with whisper-large-v3-turbo...")

            try:
                client = Groq(api_key=settings.GROQ_API_KEY)

                with open(downloaded_path, "rb") as audio_file:
                    transcription = client.audio.transcriptions.create(
                        model="whisper-large-v3-turbo",
                        file=audio_file,
                        response_format="verbose_json",
                        timestamp_granularities=["segment"]
                    )

            except Exception:
                raise HTTPException(
                    status_code=500,
                    detail={
                        "status": "transcription_failed",
                        "message": "Groq Whisper transcription failed."
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

            full_text = " ".join(seg["text"] for seg in segments)

            print(f"[whisper] success — {len(segments)} segments\n")

            return {
                "video_id": video_id,
                "full_text": full_text,
                "segments": segments
            }
