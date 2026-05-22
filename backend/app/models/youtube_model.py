from pydantic import BaseModel
from typing import List, Optional


class TranscriptSegment(BaseModel):
    text: str
    start: float
    duration: float


class YoutubeRequest(BaseModel):
    youtube_url: str
    transcript_segments: Optional[List[TranscriptSegment]] = None
