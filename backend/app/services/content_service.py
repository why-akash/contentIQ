import json
import re
import tiktoken

from app.rag.ingestion import IngestionService
from app.core.llm_helper import LLMHelper


def _parse_llm_json(content: str) -> dict:
    """Parse JSON from LLM response, stripping markdown code fences if present."""
    text = content.strip()
    # Strip ```json ... ``` or ``` ... ``` wrappers
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text.strip())
    return json.loads(text.strip())


_SUMMARY_JSON_SCHEMA = """
{
    "tldr": {
        "points": [
            "Informative point 1 with key context from the video",
            "Informative point 2 covering another essential idea",
            "Informative point 3 covering outcomes, scope, or conclusions"
        ],
        "highlights": [
            "Critical fact, metric, tool, or named detail"
        ]
    },

    "key_concepts": [
        {
            "name": "Concept name",
            "description": "Short explanation (1-2 sentences max)"
        }
    ],

    "main_takeaways": [
        "Important takeaway"
    ],

    "action_items": [
        "Practical implementation idea"
    ]
}
"""

_SUMMARY_RULES = """
IMPORTANT RULES:
- Return ONLY valid JSON (raw JSON object, nothing else)
- No markdown
- No code fences
- Do not wrap JSON in ```json blocks
- Avoid repeating ideas across sections
- Each bullet or concept must contain NEW information
- Prefer concise, information-dense writing
- Maximum 4 items in key_concepts, main_takeaways, action_items, and tldr.highlights
- tldr.points must contain EXACTLY 3 informative bullets (cover the most important ideas, facts, and outcomes)
- Each tldr.points item should be 1-2 sentences with concrete details (tools, methods, numbers, conclusions)
- tldr.highlights: up to 4 short chips with critical facts, metrics, libraries, or named entities
- Keep total response under 600 words
- Use short technical explanations
- Remove generic filler statements
- Do not restate the same concept in different wording
- Prefer technical insights over generic statements
"""


class ContentService:

    @staticmethod
    def count_tokens(
        text: str
    ):

        encoding = (
            tiktoken.get_encoding(
                "cl100k_base"
            )
        )

        return len(
            encoding.encode(text)
        )

    @classmethod
    def generate_summary(
        cls,
        transcript_segments: list
    ):

        full_text = " ".join([
            segment["text"]
            for segment
            in transcript_segments
        ])

        total_tokens = (
            cls.count_tokens(
                full_text
            )
        )

        print(
            f"\nTOTAL TOKENS: "
            f"{total_tokens}\n"
        )

        # SMALL TRANSCRIPT
        if total_tokens < 8000:

            print(
                "Using SINGLE "
                "LLM CALL"
            )

            prompt = f"""
            You are an expert technical content analyst.

            Generate concise, high-signal study notes from the transcript.

            {_SUMMARY_RULES}

            Section guidance:
            - tldr.points: EXACTLY 3 bullets; cover who/what/how/why and main outcomes; be informative not vague.
            - tldr.highlights: up to 4 short fact chips (numbers, tools, frameworks, benchmarks).
            - key_concepts: up to 4 core terms with brief definitions. No duplicates.
            - main_takeaways: up to 4 non-obvious lessons (not repeated from tldr.points).
            - action_items: up to 4 specific next steps for the viewer.

            Return JSON:

            {_SUMMARY_JSON_SCHEMA}

            Transcript:
            {full_text}
            """

            response = LLMHelper.safe_llm_call(
                prompt
            )

            try:
                return _parse_llm_json(response.content)

            except Exception:
                return {
                    "tldr": response.content,
                    "key_concepts": [],
                    "main_takeaways": [],
                    "action_items": []
                }

        # LARGE TRANSCRIPT
        print(
            "Using MAP REDUCE"
        )

        ingestion_service = (
            IngestionService()
        )

        chunks = (
            ingestion_service
            .group_segments(
                transcript_segments,
                max_chars=12000
            )
        )

        chunk_summaries = []

        # MAP STEP
        for index, chunk in enumerate(
            chunks
        ):

            print(
                f"Summarizing "
                f"chunk "
                f"{index + 1}/"
                f"{len(chunks)}"
            )

            prompt = f"""
            Analyze this content chunk.

            Extract:

            1. Important discussions
            2. Main explanations
            3. Significant facts
            4. Examples mentioned
            5. Arguments/opinions
            6. Valuable insights

            Rules:
            - Preserve important details
            - Do NOT oversummarize
            - Keep useful context

            Content:
            {chunk["text"]}
            """
                        
            response = LLMHelper.safe_llm_call(
                prompt
            )

            chunk_summaries.append(
                response.content
            )

        combined_summary = (
            "\n".join(
                chunk_summaries
            )
        )

        # REDUCE STEP
        final_prompt = f"""
        You are an expert technical content analyst.

        Using the chunk summaries below, synthesize ONE final set of
        concise study notes. Merge overlapping ideas from chunks into
        a single statement each — do not list the same idea multiple times.

        {_SUMMARY_RULES}

        Section guidance:
        - tldr.points: EXACTLY 3 bullets synthesizing the full video; merge chunk overlap.
        - tldr.highlights: up to 4 deduplicated fact chips from all chunks.
        - key_concepts: up to 4 deduplicated terms with brief definitions.
        - main_takeaways: up to 4 unique lessons (merge duplicates from chunks).
        - action_items: up to 4 specific practical next steps.

        Return JSON:

        {_SUMMARY_JSON_SCHEMA}

        Chunk Summaries:
        {combined_summary}
        """
        
        response = LLMHelper.safe_llm_call(
            final_prompt
        )

        try:

            return json.loads(
                response.content
            )

        except Exception:

            return {
                "tldr":
                response.content,

                "key_concepts": [],

                "main_takeaways": [],

                "action_items": []
            }
