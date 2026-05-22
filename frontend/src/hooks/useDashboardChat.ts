import { useEffect, useRef, useState } from "react";
import api from "../api/api";
import type { Message } from "../types/dashboard";
import { formatApiError } from "../utils/formatApiError";

export const useDashboardChat = (
  sessionId: string | undefined,
  videoId: string | undefined,
) => {
  const [expandedChunks, setExpandedChunks] =
    useState<number[]>([]);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [question, setQuestion] =
    useState("");

  const [isSending, setIsSending] =
    useState(false);

  const messagesRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesRef.current;

    if (!container) return;

    const scrollToBottom = () => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    };

    scrollToBottom();

    const timeout = setTimeout(
      scrollToBottom,
      100
    );

    return () =>
      clearTimeout(timeout);
  }, [messages]);

  const replaceLastAiMessage = (
    text: string,
    sources: any[] = []
  ) => {
    setMessages((prev) => {
      const copy = [...prev];

      for (
        let i = copy.length - 1;
        i >= 0;
        i--
      ) {
        if (
          copy[i].from === "ai"
        ) {
          copy[i] = {
            from: "ai",
            text,
            sources,
          };

          break;
        }
      }

      return copy;
    });
  };

  const streamText = async (
    fullText: string,
    sources: any[] = []
  ) => {
    let current = "";

    for (
      let i = 0;
      i < fullText.length;
      i++
    ) {
      current += fullText[i];

      replaceLastAiMessage(
        current,
        sources
      );

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 8)
      );
    }
  };

  const sendQuestion =
    async () => {
      if (
        !question.trim() ||
        !sessionId ||
        !videoId ||
        isSending
      )
        return;

      const userText =
        question.trim();

      setMessages((prev) => [
        ...prev,
        {
          from: "user",
          text: userText,
        },
        {
          from: "ai",
          text: "",
          sources: [],
        },
      ]);

      setQuestion("");
      setIsSending(true);

      try {
        const response =
          await api.post(
            "/chat/",
            {
              session_id: sessionId,
              video_id: videoId,
              question: userText,
            }
          );

        const chatData =
          response.data?.answer;

        const finalText =
          chatData?.answer ||
          "No answer available";

        const finalSources =
          chatData?.source_chunks ||
          [];

        await streamText(
          finalText,
          finalSources
        );
      } catch (error) {
        replaceLastAiMessage(
          formatApiError(
            error,
            "Unable to reach chat service. Please try again.",
          ),
        );
      } finally {
        setIsSending(false);
      }
    };

  return {
    expandedChunks,
    setExpandedChunks,
    messages,
    question,
    setQuestion,
    isSending,
    messagesRef,
    sendQuestion,
  };
};
