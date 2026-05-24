from dotenv import load_dotenv
import os

load_dotenv()


class Settings:

    GROQ_API_KEY = os.getenv(
        "GROQ_API_KEY"
    )

    MODEL_NAME = os.getenv(
        "MODEL_NAME",
        "llama-3.3-70b-versatile"
    )

    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173"
        ).split(",")
    ]

    YOUTUBE_COOKIES = os.getenv(
        "YOUTUBE_COOKIES",
        None
    )

    SUPADATA_API_KEY = os.getenv(
        "SUPADATA_API_KEY",
        None
    )


settings = Settings()