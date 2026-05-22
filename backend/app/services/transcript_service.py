import glob
import os
import shutil
import tempfile
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

            return {
                "video_id": video_id,
                "full_text": full_text,
                "segments": segments
            }

        except (IpBlocked, RequestBlocked, NoTranscriptFound, TranscriptsDisabled):
            return TranscriptService._whisper_fallback(video_id, youtube_url)

    @staticmethod
    def _whisper_fallback(video_id: str, youtube_url: str):

        with tempfile.TemporaryDirectory() as tmpdir:

            audio_path = os.path.join(tmpdir, video_id)

            _COOKIES = "/etc/secrets/youtube_cookies.txt"

            # no ffmpeg: select low-bitrate native audio to stay under Groq's 25MB limit
            ydl_opts = {
                "format": "bestaudio[abr<=64]/bestaudio[abr<=96]/worstaudio",
                "outtmpl": audio_path + ".%(ext)s",
                "quiet": True,
            }

            if os.path.exists(_COOKIES):
                cookies_copy = os.path.join(tmpdir, "cookies.txt")
                shutil.copy(_COOKIES, cookies_copy)
                ydl_opts["cookiefile"] = cookies_copy

            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([youtube_url])

            except yt_dlp.utils.DownloadError:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "status": "download_failed",
                        "message": "Could not download audio. Video may be private, unavailable, or a livestream."
                    }
                )

            files = glob.glob(audio_path + ".*")
            if not files:
                raise HTTPException(
                    status_code=500,
                    detail={
                        "status": "download_failed",
                        "message": "Audio file not found after download."
                    }
                )

            downloaded_path = files[0]

            file_size = os.path.getsize(downloaded_path)
            if file_size > 24 * 1024 * 1024:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "status": "file_too_large",
                        "message": "Audio exceeds 25 MB limit. Try a video under 45 minutes."
                    }
                )

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
                    "text": seg.text,
                    "start": seg.start,
                    "duration": seg.end - seg.start
                }
                for seg in transcription.segments
            ]

            full_text = " ".join(seg["text"] for seg in segments)

            return {
                "video_id": video_id,
                "full_text": full_text,
                "segments": segments
            }
