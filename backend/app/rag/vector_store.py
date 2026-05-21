from langchain_chroma import (
    Chroma
)

from langchain_huggingface import (
    HuggingFaceEmbeddings
)


class VectorStoreService:

    def __init__(self):

        self.embedding_model = (
            HuggingFaceEmbeddings(
                model_name=
                "sentence-transformers/all-MiniLM-L6-v2"
            )
        )

    def get_vector_store(
        self,
        session_id: str
    ):

        return Chroma(
            collection_name=
            session_id,

            persist_directory=
            "app/data/chroma",

            embedding_function=
            self.embedding_model
        )