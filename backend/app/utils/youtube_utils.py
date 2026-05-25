from urllib.parse import urlparse, parse_qs

def extract_video_id(url: str):
    parsed_url = urlparse(url)
    netloc = parsed_url.netloc.lower()

    # youtu.be/VIDEO_ID short links
    if "youtu.be" in netloc:
        video_id = parsed_url.path.lstrip("/").split("/")[0]
        return video_id if video_id else None

    # youtube.com/shorts/VIDEO_ID  or  /live/VIDEO_ID
    if "youtube.com" in netloc:
        path_parts = parsed_url.path.strip("/").split("/")
        if len(path_parts) >= 2 and path_parts[0] in ("shorts", "live", "embed"):
            return path_parts[1]

    # youtube.com/watch?v=VIDEO_ID
    query_params = parse_qs(parsed_url.query)
    return query_params.get("v", [None])[0]