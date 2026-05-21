import { SendHorizonal } from "lucide-react";

type ChatInputProps = {
  question: string;
  onQuestionChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  isSending: boolean;
};

const ChatInput = ({
  question,
  onQuestionChange,
  onSend,
  disabled,
  isSending,
}: ChatInputProps) => (
  <div className="border-t border-slate-700/50 p-4 sm:p-5">
    <div className="relative flex items-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-2 transition focus-within:border-orange-400/40 focus-within:ring-2 focus-within:ring-orange-500/10 sm:gap-3 sm:p-3">
      <input
        value={question}
        onChange={(e) =>
          onQuestionChange(
            e.target.value
          )
        }
        onKeyDown={(e) => {
          if (
            e.key ===
            "Enter"
          ) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="Ask anything about the video..."
        disabled={disabled}
        className="flex-1 bg-transparent px-3 text-[15px] text-slate-100 outline-none placeholder:text-slate-600 sm:px-4"
      />

      <button
        onClick={onSend}
        disabled={
          disabled ||
          isSending
        }
        className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-900/30 transition duration-300 hover:from-orange-400 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:h-14 sm:w-14"
      >
        <SendHorizonal className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  </div>
);

export default ChatInput;
