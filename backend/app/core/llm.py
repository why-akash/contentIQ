from langchain_groq import (
    ChatGroq
)

from app.core.config import (
    settings
)


llm = ChatGroq(
    api_key=settings.GROQ_API_KEY,
    model=settings.MODEL_NAME,
    temperature=0.2,
    timeout=45,
    max_retries=1,
)