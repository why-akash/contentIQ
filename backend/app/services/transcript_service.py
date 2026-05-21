from fastapi import (
    HTTPException
)

from youtube_transcript_api import (
    YouTubeTranscriptApi
)

from youtube_transcript_api._errors import (
    IpBlocked,
    NoTranscriptFound,
    TranscriptsDisabled
)

from app.utils.youtube_utils import (
    extract_video_id
)


class TranscriptService:

    @staticmethod
    def get_youtube_transcript(
        youtube_url: str
    ):

        video_id = extract_video_id(
            youtube_url
        )

        if not video_id:

            raise HTTPException(
                status_code=400,

                detail={
                    "status":
                    "invalid_url",

                    "message":
                    "Invalid YouTube URL."
                }
            )

        try:

            transcript = (
                YouTubeTranscriptApi()
                .fetch(video_id)
            )

        except IpBlocked:

            raise HTTPException(
                status_code=429,

                detail={
                    "status":
                    "youtube_blocked",

                    "message":
                    (
                        "YouTube temporarily "
                        "blocked requests."
                    ),

                    "solution":
                    (
                        "Try mobile hotspot "
                        "or retry later."
                    )
                }
            )

        except NoTranscriptFound:

            raise HTTPException(
                status_code=404,

                detail={
                    "status":
                    "transcript_not_found",

                    "message":
                    (
                        "No transcript found "
                        "for this video."
                    )
                }
            )

        except TranscriptsDisabled:

            raise HTTPException(
                status_code=403,

                detail={
                    "status":
                    "transcript_disabled",

                    "message":
                    (
                        "Transcript is disabled "
                        "for this video."
                    )
                }
            )

        segments = [
            {
                "text":
                item.text,

                "start":
                item.start,

                "duration":
                item.duration
            }
            for item in transcript
        ]

        full_text = " ".join([
            item.text
            for item in transcript
        ])

        return {
            "video_id":
            video_id,

            "full_text":
            full_text,

            "segments":
            segments
        }