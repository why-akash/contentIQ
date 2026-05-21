import type { RefObject } from "react";
import type { Message } from "../../types/dashboard";
import ChatEmptyState from "./ChatEmptyState";
import ChatMessage from "./ChatMessage";

type ChatMessagesProps = {
  messages: Message[];
  messagesRef: RefObject<HTMLDivElement>;
  expandedChunks: number[];
  onToggleChunk: (messageIndex: number) => void;
  onSelectSuggestion: (text: string) => void;
};

const ChatMessages = ({
  messages,
  messagesRef,
  expandedChunks,
  onToggleChunk,
  onSelectSuggestion,
}: ChatMessagesProps) => (
  <div
    ref={messagesRef}
    className="flex-1 overflow-y-auto px-5 py-6"
  >
    <div className="space-y-7">
      {messages.length === 0 && (
        <ChatEmptyState
          onSelectSuggestion={
            onSelectSuggestion
          }
        />
      )}

      {messages.map(
        (message, idx) => (
          <ChatMessage
            key={idx}
            message={message}
            isExpanded={expandedChunks.includes(
              idx
            )}
            onToggleSources={() =>
              onToggleChunk(idx)
            }
          />
        )
      )}
    </div>
  </div>
);

export default ChatMessages;
