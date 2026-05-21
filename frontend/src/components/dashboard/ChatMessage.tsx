import {
  Bot,
  ChevronDown,
  ChevronRight,
  Clock3,
  Sparkles,
  User,
} from "lucide-react";
import type { Message } from "../../types/dashboard";

type ChatMessageProps = {
  message: Message;
  isExpanded: boolean;
  onToggleSources: () => void;
};

const ChatMessage = ({
  message,
  isExpanded,
  onToggleSources,
}: ChatMessageProps) => {
  if (
    message.from === "ai" &&
    message.text === ""
  ) {
    return (
      <div className="flex justify-start">
        <div className="flex max-w-[90%] gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-400/20 bg-orange-500/10 text-orange-300 sm:h-11 sm:w-11">
            <Bot className="h-5 w-5" />
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 px-5 py-4 sm:px-6 sm:py-5">
            <div className="space-y-2.5">
              <div className="h-2.5 w-28 animate-pulse rounded-full bg-slate-700/80" />
              <div className="h-2.5 w-48 animate-pulse rounded-full bg-slate-700/80 sm:w-56" />
              <div className="h-2.5 w-36 animate-pulse rounded-full bg-slate-700/80 sm:w-44" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${
        message.from === "user"
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`flex max-w-[92%] gap-4 ${
          message.from === "user"
            ? "flex-row-reverse"
            : ""
        }`}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
            message.from === "user"
              ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-900/25"
              : "border border-orange-400/20 bg-orange-500/10 text-orange-300"
          }`}
        >
          {message.from ===
          "user" ? (
            <User className="h-5 w-5" />
          ) : (
            <Bot className="h-5 w-5" />
          )}
        </div>

        <div
          className={`overflow-hidden rounded-2xl ${
            message.from === "user"
              ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-900/20"
              : "border border-slate-700/60 bg-slate-900/50 text-slate-200"
          }`}
        >
          <div className="px-5 py-4 sm:px-6 sm:py-5">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {message.text}
            </p>
          </div>

          {message.from ===
            "ai" &&
            message.sources &&
            message.sources.length >
              0 && (
              <div className="border-t border-slate-700/50 bg-slate-950/30">
                <button
                  onClick={
                    onToggleSources
                  }
                  className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-slate-900/50 sm:px-6 sm:py-5"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-orange-300" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-orange-300" />
                    )}

                    <span className="font-medium text-orange-200">
                      Source
                      Chunks
                    </span>

                    <span className="rounded-full border border-orange-400/25 bg-orange-500/10 px-3 py-1 text-xs text-orange-200">
                      {
                        message
                          .sources
                          .length
                      }
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="space-y-3 px-4 pb-4 sm:space-y-4 sm:px-5 sm:pb-5">
                    {message.sources.map(
                      (
                        source,
                        sourceIndex,
                      ) => (
                        <div
                          key={
                            sourceIndex
                          }
                          className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 sm:p-5"
                        >
                          <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4 sm:gap-3">
                            <div className="flex items-center gap-2 text-orange-300">
                              <Sparkles className="h-4 w-4" />

                              <span className="text-sm font-medium">
                                Chunk{" "}
                                {sourceIndex +
                                  1}
                              </span>
                            </div>

                            {source
                              .metadata
                              ?.start_time && (
                              <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-300">
                                <Clock3 className="h-3 w-3 text-orange-400/80" />

                                {Math.floor(
                                  source
                                    .metadata
                                    .start_time /
                                    60
                                )}
                                :
                                {String(
                                  Math.floor(
                                    source
                                      .metadata
                                      .start_time %
                                      60
                                  )
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </div>
                            )}
                          </div>

                          <p className="text-sm leading-relaxed text-slate-400">
                            {
                              source.text
                            }
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
