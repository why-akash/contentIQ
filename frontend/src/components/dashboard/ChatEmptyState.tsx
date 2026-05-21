import { Bot } from "lucide-react";

const SUGGESTIONS = [
  "Summarize this video",
  "Important concepts",
  "Interview questions",
  "Key timestamps",
];

type ChatEmptyStateProps = {
  onSelectSuggestion: (text: string) => void;
};

const ChatEmptyState = ({
  onSelectSuggestion,
}: ChatEmptyStateProps) => (
  <div className="mt-12 flex flex-col items-center px-2 text-center sm:mt-16">
    <div className="relative mb-5 sm:mb-6">
      <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-3xl" />

      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-orange-400/25 bg-orange-500/10 text-orange-300 ring-1 ring-slate-700/50 sm:h-24 sm:w-24">
        <Bot className="h-9 w-9 sm:h-10 sm:w-10" />
      </div>
    </div>

    <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
      Ask Anything
    </h2>

    <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 sm:mt-3">
      Get summaries, timestamps,
      explanations, interview
      preparation, coding concepts,
      and more from this video.
    </p>

    <div className="mt-6 flex flex-wrap justify-center gap-2 sm:mt-8 sm:gap-3">
      {SUGGESTIONS.map((item) => (
        <button
          key={item}
          onClick={() =>
            onSelectSuggestion(item)
          }
          className="rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-2.5 text-sm text-slate-300 transition hover:border-orange-400/30 hover:bg-orange-500/10 hover:text-orange-200 sm:px-5 sm:py-3"
        >
          {item}
        </button>
      ))}
    </div>
  </div>
);

export default ChatEmptyState;
