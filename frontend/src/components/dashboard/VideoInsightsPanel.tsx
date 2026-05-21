import { BrainCircuit } from "lucide-react";
import type {
  DashboardInsights,
  TldrInsights,
} from "../../types/dashboard";
import InsightListSection from "./InsightListSection";
import KeyConceptsSection from "./KeyConceptsSection";
import SmartSummarySection from "./SmartSummarySection";

type VideoInsightsPanelProps = {
  tldrInsights: TldrInsights | null;
  insightsKeyConcepts: DashboardInsights["insightsKeyConcepts"];
  insightsMainTakeaways: string[];
  insightsActionItems: string[];
  summaryText: string | null;
};

const VideoInsightsPanel = ({
  tldrInsights,
  insightsKeyConcepts,
  insightsMainTakeaways,
  insightsActionItems,
  summaryText,
}: VideoInsightsPanelProps) => (
  <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/25">
    <div className="border-b border-slate-700/50 bg-slate-900/40 px-5 py-4 sm:px-7">
      <div className="flex items-center gap-2.5">
        <BrainCircuit className="h-5 w-5 text-orange-300" />
        <h2 className="font-display text-lg font-semibold text-white">
          Video Insights
        </h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        AI-generated summary and key takeaways
      </p>
    </div>

    <div className="divide-y divide-slate-700/50">
      {tldrInsights && (
        <SmartSummarySection
          tldrInsights={tldrInsights}
        />
      )}

      <KeyConceptsSection
        concepts={insightsKeyConcepts}
      />

      <InsightListSection
        title="Main Takeaways"
        data={insightsMainTakeaways}
      />

      <InsightListSection
        title="Action Items"
        data={insightsActionItems}
        variant="green"
      />

      {summaryText && (
        <section className="px-5 py-5 sm:px-7 sm:py-6">
          <h3 className="font-display text-base font-semibold text-white">
            Summary
          </h3>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
            {summaryText}
          </p>
        </section>
      )}
    </div>
  </div>
);

export default VideoInsightsPanel;
