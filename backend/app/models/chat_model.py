from pydantic import BaseModel

class ChatRequest(BaseModel):
    session_id: str
    video_id: str
    question: str
