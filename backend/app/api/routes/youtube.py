from fastapi import (
    APIRouter
)

import uuid

from app.models.youtube_model import (
    YoutubeRequest
)

from app.services.transcript_service import (
    TranscriptService
)

from app.services.content_service import (
    ContentService
)

from app.rag.ingestion import (
    IngestionService
)

router = APIRouter(
    prefix="/youtube",
    tags=["YouTube"]
)


@router.post("/process")
async def process_youtube(
    request: YoutubeRequest
):

    session_id = str(
        uuid.uuid4()
    )

    transcript_data = (
        TranscriptService
        .get_youtube_transcript(
            request.youtube_url
        )
    )

    # summary generation
    summary = (
        ContentService
        .generate_summary(
            transcript_data[
                "segments"
            ]
        )
    )

    # rag ingestion
    IngestionService().store_embeddings(
        transcript_segments=
        transcript_data[
            "segments"
        ],

        session_id=
        session_id,

        video_id=
        transcript_data[
            "video_id"
        ]
    )

    return {

        "session_id":
        session_id,

        "video_id":
        transcript_data[
            "video_id"
        ],

        "summary":
        summary,

        "status":
    
        "chat_ready"
    }