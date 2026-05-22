import re

from app.rag.vector_store import VectorStoreService
from app.core.llm_helper import LLMHelper


chat_memory = {}

_TIMESTAMP_KEYWORDS = [
    "timestamp",
    "time",
    "when",
    "where",
    "which part",
    "at what point",
    "where is this discussed",
]

_FOLLOWUP_PATTERNS = [
    "where",
    "when",
    "which part",
    "timestamp",
    "time",
    "at what point",
    "tell me more",
    "explain more",
    "why",
    "how",
]

_REVISION_REQUEST = re.compile(
    r"(?:"
    r"make\s+(?:it|this)?\s*(?:short|brief|shorter)|"
    r"(?:keep\s+it\s+)?(?:brief|shorter)|"
    r"simplify|"
    r"in\s+simple\s+(?:terms|words)|"
    r"summarize\s+(?:that|your(?:\s+last)?\s+answer)|"
    r"(?:too\s+)?long|"
    r"tl;dr|"
    r"condense"
    r")",
    re.IGNORECASE,
)


class RetrievalService:

    @staticmethod
    def _format_history(
        history: list,
    ) -> str:

        if not history:
            return "None"

        lines = []

        for turn in history[-4:]:
            lines.append(
                f"User: {turn['question']}\n"
                f"Assistant: {turn['answer']}"
            )

        return "\n\n".join(lines)

    @staticmethod
    def _rewrite_followup_question(
        question: str,
        history: list,
    ) -> str:

        if not history:
            return question

        lowered = question.lower().strip()

        is_followup = any(
            pattern in lowered
            for pattern in _FOLLOWUP_PATTERNS
        )

        if not is_followup:
            return question

        last_question = history[-1]["question"]

        return (
            f"{last_question}\n"
            f"Follow-up: {question}"
        )

    @staticmethod
    def _is_revision_request(
        question: str,
    ) -> bool:

        return bool(
            _REVISION_REQUEST.search(
                question.strip()
            )
        )

    @staticmethod
    def _needs_timestamp(
        question: str,
    ) -> bool:

        lowered = question.lower()

        return any(
            keyword in lowered
            for keyword in _TIMESTAMP_KEYWORDS
        )

    @staticmethod
    def format_timestamp(
        seconds: float
    ):

        minutes = int(
            seconds // 60
        )

        remaining_seconds = int(
            seconds % 60
        )

        return (
            f"{minutes}m "
            f"{remaining_seconds}s"
        )

    def get_retriever(
        self,
        video_id: str
    ):

        vector_store = (
            VectorStoreService()
            .get_vector_store(
                video_id
            )
        )

        return (
            vector_store
            .as_retriever(

                search_type="mmr",

                search_kwargs={
                    "k": 5,
                    "fetch_k": 15,
                    "lambda_mult": 0.75
                }
            )
        )

    def ask_question(
        self,
        session_id: str,
        video_id: str,
        question: str
    ):

        history = chat_memory.get(session_id, [])

        formatted_history = (
            self._format_history(
                history
            )
        )

        # Follow-up: shorten / simplify previous answer (do not re-retrieve)
        if (
            self._is_revision_request(
                question
            )
        ):

            if not history:

                return {
                    "answer":
                    "Ask a question about the video first, then I can shorten it.",

                    "source_chunks":
                    []
                }

            last_turn = history[-1]

            prompt = f"""
            You are a concise video assistant.

            The user wants a SHORTER version of your previous answer.
            Do NOT introduce a new topic. Keep the same meaning and facts.

            Conversation History:
            {formatted_history}

            Previous question:
            {last_turn['question']}

            Previous answer (rewrite shorter):
            {last_turn['answer']}

            User request:
            {question}

            Rules:
            - Maximum 2-3 sentences total
            - Plain language, no filler
            - Do not mention timestamps or "jump to" when shortening
            - No bullet lists unless essential
            """

            response = LLMHelper.safe_llm_call(
                prompt
            )

            answer = response.content

            if (
                session_id
                not in chat_memory
            ):
                chat_memory[session_id] = []

            chat_memory[session_id].append({
                "question": question,
                "answer": answer,
            })

            return {
                "answer": answer,
                "source_chunks": [],
            }

        retriever = (
            self.get_retriever(
                video_id
            )
        )

        retrieval_query = (
            self._rewrite_followup_question(
                question,
                history,
            )
        )

        docs = retriever.invoke(
            retrieval_query
        )

        query_words = set(
            word
            for word in re.findall(
                r"\w+",
                question.lower()
            )
            if len(word) > 2
        )

        scored_docs = []

        for doc in docs:

            score = sum(
                doc.page_content
                .lower()
                .count(word)
                for word in query_words
            )

            if score > 0:
                scored_docs.append(
                    (doc, score)
                )

        scored_docs.sort(
            key=lambda x: x[1],
            reverse=True
        )

        if scored_docs:
            docs = [
                doc
                for doc, score
                in scored_docs[:3]
            ]
        else:
            docs = docs[:3]

        if not docs:

            return {
                "answer":
                "This wasn't discussed.",

                "source_chunks":
                []
            }

        best_doc = docs[0]

        start_timestamp = (
            self.format_timestamp(
                best_doc.metadata.get(
                    "start_time",
                    0
                )
            )
        )

        end_timestamp = (
            self.format_timestamp(
                best_doc.metadata.get(
                    "end_time",
                    0
                )
            )
        )

        context = "\n\n".join([
            f"""Source Chunk {index + 1}
Timestamp: {self.format_timestamp(doc.metadata.get("start_time", 0))}
Content: {doc.page_content}"""
            for index, doc
            in enumerate(docs)
        ])

        needs_timestamp = (
            self._needs_timestamp(
                question
            )
        )

        timestamp_instruction = (
            f"Mention this timeframe naturally once: around {start_timestamp} to {end_timestamp}."
            if needs_timestamp
            else "Do not mention timestamps, video times, or 'jump to' phrasing."
        )

        timeframe_context = (
            f"Relevant timeframe: {start_timestamp} to {end_timestamp}\n"
            if needs_timestamp
            else ""
        )

        prompt = f"""
        You are a concise video assistant.

        Answer from retrieved context only. Use conversation history for follow-up context.

        Conversation History:
        {formatted_history}

        Retrieved Context:
        {context}

        Question:
        {question}

        {timeframe_context}
        Rules:
        1. Answer ONLY from retrieved context — never hallucinate.
        2. Default length: 2-4 sentences. Be direct and information-dense.
        3. For "what is X" / "how does X work" / "why use X": explain clearly without timing unless asked.
        4. {timestamp_instruction}
        5. Do NOT use filler templates ("At this point, the instructor explains...").
        6. Ignore irrelevant chunks.
        7. If not in context: "This wasn't discussed."
        """

        response = LLMHelper.safe_llm_call(
            prompt
        )

        answer = (
            response.content
        )

        if (
            session_id
            not in chat_memory
        ):
            chat_memory[
                session_id
            ] = []

        chat_memory[
            session_id
        ].append({
            "question":
            question,

            "answer":
            answer
        })

        return {
            "answer":
            answer,

            "source_chunks":
            [
                {
                    "text":
                    doc.page_content[
                        :200
                    ],

                    "metadata":
                    doc.metadata
                }
                for doc in docs
            ]
        }