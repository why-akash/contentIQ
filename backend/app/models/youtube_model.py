from pydantic import BaseModel

class YoutubeRequest(BaseModel):
    youtube_url: str