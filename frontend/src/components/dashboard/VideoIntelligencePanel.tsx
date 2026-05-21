import type { DashboardInsights } from "../../types/dashboard";
import DashboardHeader from "./DashboardHeader";
import VideoEmbed from "./VideoEmbed";
import VideoInsightsPanel from "./VideoInsightsPanel";

type VideoIntelligencePanelProps = {
  videoId?: string;
  status?: string;
  embedUrl: string | null;
  hasUnifiedInsights: boolean;
  tldrInsights: DashboardInsights["tldrInsights"];
  insightsKeyConcepts: DashboardInsights["insightsKeyConcepts"];
  insightsMainTakeaways: string[];
  insightsActionItems: string[];
  summaryText: string | null;
};

const VideoIntelligencePanel = ({
  videoId,
  status,
  embedUrl,
  hasUnifiedInsights,
  tldrInsights,
  insightsKeyConcepts,
  insightsMainTakeaways,
  insightsActionItems,
  summaryText,
}: VideoIntelligencePanelProps) => (
  <div className="glass-panel flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl">
    <DashboardHeader
      videoId={videoId}
      status={status}
    />

    <div className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-7">
      <div className="mx-auto max-w-6xl space-y-6">
        {embedUrl && (
          <VideoEmbed embedUrl={embedUrl} />
        )}

        {hasUnifiedInsights && (
          <VideoInsightsPanel
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
      </div>
    </div>
  </div>
);

export default VideoIntelligencePanel;
