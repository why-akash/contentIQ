import {
  Bot,
  Expand,
  Minimize2,
  Sparkles,
} from "lucide-react";

type ChatHeaderProps = {
  isChatExpanded: boolean;
  onToggleExpand: () => void;
};

const ChatHeader = ({
  isChatExpanded,
  onToggleExpand,
}: ChatHeaderProps) => (
  <div className="border-b border-slate-700/50 p-5 sm:p-6">
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-2xl bg-orange-500/20 blur-xl" />

          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-orange-400/25 bg-orange-500/10 text-orange-300 ring-1 ring-slate-700/50 sm:h-14 sm:w-14">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>

        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs text-orange-200">
            <Sparkles className="h-3 w-3" />
            AI Assistant
          </div>

          <h2 className="font-display mt-1.5 truncate text-xl font-semibold text-white sm:mt-2 sm:text-2xl">
            Video Chat
          </h2>

          <p className="truncate text-sm text-slate-500">
            Ask anything about the video
          </p>
        </div>
      </div>

      <button
        onClick={onToggleExpand}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/50 text-slate-400 transition duration-300 hover:border-orange-400/30 hover:bg-orange-500/10 hover:text-orange-300 sm:h-12 sm:w-12"
      >
        {isChatExpanded ? (
          <Minimize2 className="h-5 w-5" />
        ) : (
          <Expand className="h-5 w-5" />
        )}
      </button>
    </div>
  </div>
);

export default ChatHeader;
