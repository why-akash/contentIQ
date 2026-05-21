
from pprint import pprint

from langchain_core.documents import (
    Document
)

from app.rag.vector_store import (
    VectorStoreService
)


class IngestionService:

    def group_segments(
        self,
        segments: list,
        max_chars: int = 3500,
        max_duration: int = 120
    ):

        grouped_chunks = []

        current_text = []
        current_length = 0
        start_time = None

        for segment in segments:

            text = segment["text"]

            if start_time is None:
                start_time = (
                    segment["start"]
                )

            current_text.append(
                text
            )

            current_length += len(
                text
            )

            current_duration = (
                segment["start"]
                - start_time
            )

            if (
                current_length >= max_chars
                or
                current_duration >= max_duration
            ):

                grouped_chunks.append({
                    "text":
                    " ".join(
                        current_text
                    ),

                    "start_time":
                    start_time,

                    "end_time":
                    (
                        segment["start"]
                        +
                        segment[
                            "duration"
                        ]
                    )
                })

                current_text = []
                current_length = 0
                start_time = None

        if current_text:

            grouped_chunks.append({
                "text":
                " ".join(
                    current_text
                ),

                "start_time":
                start_time,

                "end_time":
                (
                    segments[-1][
                        "start"
                    ]
                    +
                    segments[-1][
                        "duration"
                    ]
                )
            })

        return grouped_chunks

    def create_documents(
        self,
        grouped_chunks: list,
        session_id: str,
        video_id: str
    ):

        docs = []

        for index, chunk in enumerate(
            grouped_chunks
        ):

            docs.append(
                Document(
                    page_content=
                    chunk["text"],

                    metadata={
                        "id":
                        f"{session_id}_{index}",

                        "session_id":
                        session_id,

                        "video_id":
                        video_id,

                        "chunk_index":
                        index,

                        "start_time":
                        chunk[
                            "start_time"
                        ],

                        "end_time":
                        chunk[
                            "end_time"
                        ],

                        "source_type":
                        "youtube"
                    }
                )
            )

        return docs

    def store_embeddings(
        self,
        transcript_segments: list,
        session_id: str,
        video_id: str
    ):

        grouped_chunks = (
            self.group_segments(
                transcript_segments
            )
        )

        docs = (
            self.create_documents(
                grouped_chunks,
                session_id,
                video_id
            )
        )

        vector_store = (
            VectorStoreService()
            .get_vector_store(
                session_id
            )
        )

        vector_store.add_documents(
            docs
        )

        return True