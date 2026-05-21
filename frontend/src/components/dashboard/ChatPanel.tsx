import type { RefObject } from "react";
import type { Message } from "../../types/dashboard";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";

type ChatPanelProps = {
  isChatExpanded: boolean;
  onToggleExpand: () => void;
  messages: Message[];
  messagesRef: RefObject<HTMLDivElement>;
  expandedChunks: number[];
  onToggleChunk: (messageIndex: number) => void;
  question: string;
  onQuestionChange: (value: string) => void;
  onSend: () => void;
  sessionId?: string;
  isSending: boolean;
};

const ChatPanel = ({
  isChatExpanded,
  onToggleExpand,
  messages,
  messagesRef,
  expandedChunks,
  onToggleChunk,
  question,
  onQuestionChange,
  onSend,
  sessionId,
  isSending,
}: ChatPanelProps) => (
  <div
    className={`glass-panel flex flex-col overflow-hidden rounded-2xl transition-all duration-500 ${
      isChatExpanded
        ? "w-full"
        : "w-full min-w-0 sm:w-[400px] sm:min-w-[400px] lg:w-[420px] lg:min-w-[420px]"
    }`}
  >
    <ChatHeader
      isChatExpanded={isChatExpanded}
      onToggleExpand={onToggleExpand}
    />

    <ChatMessages
      messages={messages}
      messagesRef={messagesRef}
      expandedChunks={expandedChunks}
      onToggleChunk={onToggleChunk}
      onSelectSuggestion={
        onQuestionChange
      }
    />

    <ChatInput
      question={question}
      onQuestionChange={
        onQuestionChange
      }
      onSend={onSend}
      disabled={!sessionId}
      isSending={isSending}
    />
  </div>
);

export default ChatPanel;
