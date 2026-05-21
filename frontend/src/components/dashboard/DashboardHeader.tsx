import { Sparkles, Youtube } from "lucide-react";

type DashboardHeaderProps = {
  videoId?: string;
  status?: string;
};

const DashboardHeader = ({
  videoId,
  status,
}: DashboardHeaderProps) => (
  <div className="border-b border-slate-700/50 px-5 py-4 sm:px-6 sm:py-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-xl bg-orange-500/20 blur-lg" />

          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-rose-500/10 text-orange-300 ring-1 ring-orange-400/25">
            <Youtube className="h-6 w-6" />
          </div>
        </div>

        <div className="min-w-0 py-0.5">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200">
            <Sparkles className="h-3 w-3 shrink-0" />
            AI Powered Analysis
          </span>

          <h1 className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Video Intelligence
          </h1>

          <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-400">
            Understand videos faster with AI-generated insights.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-3 lg:justify-end">
        <div className="min-w-[10.5rem] rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-2.5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Video ID
          </div>
          <div className="mt-0.5 font-mono text-sm font-medium text-slate-200">
            {videoId}
          </div>
        </div>

        <div className="min-w-[8.5rem] rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-300/80">
            Status
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-sm font-medium text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-soft" />
            {status}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardHeader;
