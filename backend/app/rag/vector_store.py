from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# Loaded once on first use, reused for every request
_embedding_model: HuggingFaceEmbeddings | None = None


def get_embedding_model() -> HuggingFaceEmbeddings:
    global _embedding_model
    if _embedding_model is None:
        print(f"[embed] loading model {_MODEL_NAME} into memory...")
        _embedding_model = HuggingFaceEmbeddings(model_name=_MODEL_NAME)
        print(f"[embed] model loaded ✅")
    return _embedding_model


class VectorStoreService:

    def get_vector_store(self, session_id: str):
        return Chroma(
            collection_name=session_id,
            persist_directory="app/data/chroma",
            embedding_function=get_embedding_model(),
        )
