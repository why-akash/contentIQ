from typing import List

from langchain_chroma import Chroma
from langchain_core.embeddings import Embeddings


class OnnxEmbeddings(Embeddings):
    """
    all-MiniLM-L6-v2 via ChromaDB's ONNX Runtime backend.
    No PyTorch — uses ~150MB RAM vs 500MB+ for torch.
    Singleton so the model is loaded once and reused.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            print("[embed] loading ONNX embedding model...")
            from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
            cls._instance._ef = DefaultEmbeddingFunction()
            print("[embed] ONNX model ready ✅")
        return cls._instance

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [v.tolist() for v in self._ef(texts)]

    def embed_query(self, text: str) -> List[float]:
        return self._ef([text])[0].tolist()


class VectorStoreService:

    def get_vector_store(self, session_id: str) -> Chroma:
        return Chroma(
            collection_name=session_id,
            persist_directory="app/data/chroma",
            embedding_function=OnnxEmbeddings(),
        )
