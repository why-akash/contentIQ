import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardBackground from "../components/dashboard/DashboardBackground";
import ChatPanel from "../components/dashboard/ChatPanel";
import VideoIntelligencePanel from "../components/dashboard/VideoIntelligencePanel";
import { useDashboardChat } from "../hooks/useDashboardChat";
import type { DashboardLocationState } from "../types/dashboard";
import { buildDashboardInsights } from "../utils/buildDashboardInsights";

const DashboardPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isChatExpanded, setIsChatExpanded] =
    useState(false);

  const state = location.state as DashboardLocationState;

  const summaryObject =
    state?.summary &&
    typeof state.summary === "object"
      ? state.summary
      : null;

  const summaryText =
    state?.summary &&
    typeof state.summary === "string"
      ? state.summary
      : null;

  useEffect(() => {
    if (
      !state ||
      (!summaryObject && !summaryText)
    ) {
      navigate("/", {
        replace: true,
      });
    }
  }, [
    navigate,
    state,
    summaryObject,
    summaryText,
  ]);

  const embedUrl = useMemo(() => {
    if (!state?.video_id)
      return null;

    return `https://www.youtube.com/embed/${state.video_id}`;
  }, [state?.video_id]);

  const {
    expandedChunks,
    setExpandedChunks,
    messages,
    question,
    setQuestion,
    isSending,
    messagesRef,
    sendQuestion,
  } = useDashboardChat(state?.session_id);

  const {
    tldrInsights,
    insightsKeyConcepts,
    insightsMainTakeaways,
    insightsActionItems,
    hasUnifiedInsights,
  } = buildDashboardInsights(
    summaryObject,
    summaryText,
  );

  const handleToggleChunk = (
    messageIndex: number,
  ) => {
    setExpandedChunks((prev) =>
      prev.includes(messageIndex)
        ? prev.filter(
            (i) =>
              i !==
              messageIndex,
          )
        : [
            ...prev,
            messageIndex,
          ],
    );
  };

  if (!state) return null;

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <DashboardBackground />

      <div className="relative mx-auto flex h-screen max-w-[1800px] gap-4 p-4 sm:gap-5 sm:p-5 lg:gap-6 lg:p-6">
        {!isChatExpanded && (
          <VideoIntelligencePanel
            videoId={state.video_id}
            status={state.status}
            embedUrl={embedUrl}
            hasUnifiedInsights={
              hasUnifiedInsights
            }
            tldrInsights={tldrInsights}
            insightsKeyConcepts={
              insightsKeyConcepts
            }
            insightsMainTakeaways={
              insightsMainTakeaways
            }
            insightsActionItems={
              insightsActionItems
            }
            summaryText={summaryText}
          />
        )}

        <ChatPanel
          isChatExpanded={isChatExpanded}
          onToggleExpand={() =>
            setIsChatExpanded(
              !isChatExpanded,
            )
          }
          messages={messages}
          messagesRef={messagesRef}
          expandedChunks={expandedChunks}
          onToggleChunk={handleToggleChunk}
          question={question}
          onQuestionChange={setQuestion}
          onSend={sendQuestion}
          sessionId={state.session_id}
          isSending={isSending}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
