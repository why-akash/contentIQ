import re

from groq import (
    RateLimitError
)

from fastapi import (
    HTTPException
)

from app.core.llm import (
    llm
)


class LLMHelper:

    @staticmethod
    def safe_llm_call(
        prompt: str
    ):

        try:

            return llm.invoke(
                prompt
            )

        except RateLimitError as e:

            error_message = str(e)

            retry_match = (
                re.search(
                    r"try again in (.+?)\.",
                    error_message
                )
            )

            retry_after = (
                retry_match.group(1)
                if retry_match
                else "later"
            )

            raise HTTPException(
                status_code=429,

                detail={
                    "status":
                    "quota_exceeded",

                    "message":
                    (
                        "Groq free tier "
                        "daily limit reached."
                    ),

                    "retry_after":
                    retry_after
                }
            )

        except Exception as e:

            raise HTTPException(
                status_code=500,

                detail={
                    "status":
                    "llm_error",

                    "message":
                    str(e)
                }
            )