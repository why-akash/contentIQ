from urllib.parse import urlparse, parse_qs

def extract_video_id(url: str):
    parsed_url = urlparse(url)
    if "youtube.be" in parsed_url.netloc:
        return parsed_url.path[1:]
    query_params = parse_qs(parsed_url.query)
    return query_params.get("v", [None])[0]