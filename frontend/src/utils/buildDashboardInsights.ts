import type { DashboardInsights } from "../types/dashboard";
import { parseTldrInsights } from "./parseTldrInsights";

export const buildDashboardInsights = (
  summaryObject: Record<string, any> | null,
  summaryText: string | null,
): DashboardInsights => {
  const tldrInsights = parseTldrInsights(
    summaryObject?.tldr ??
      summaryObject?.overview,
  );

  const insightsKeyConcepts = (
    Array.isArray(summaryObject?.key_concepts)
      ? summaryObject.key_concepts
      : Array.isArray(summaryObject?.topics)
        ? summaryObject.topics.map((topic: string) => ({
            name: topic,
            description: "",
          }))
        : []
  ).slice(0, 4);

  const insightsMainTakeaways = (
    Array.isArray(summaryObject?.main_takeaways)
      ? summaryObject.main_takeaways
      : [
          ...(Array.isArray(summaryObject?.important_points)
            ? summaryObject.important_points
            : []),
          ...(Array.isArray(summaryObject?.key_insights)
            ? summaryObject.key_insights
            : []),
        ]
  ).slice(0, 4);

  const insightsActionItems = (
    Array.isArray(summaryObject?.action_items)
      ? summaryObject.action_items
      : Array.isArray(summaryObject?.actionable_takeaways)
        ? summaryObject.actionable_takeaways
        : []
  ).slice(0, 4);

  const hasUnifiedInsights =
    (tldrInsights &&
      (tldrInsights.points.length > 0 ||
        tldrInsights.highlights.length > 0)) ||
    insightsKeyConcepts.length > 0 ||
    insightsMainTakeaways.length > 0 ||
    insightsActionItems.length > 0 ||
    !!summaryText;

  return {
    tldrInsights,
    insightsKeyConcepts,
    insightsMainTakeaways,
    insightsActionItems,
    hasUnifiedInsights,
  };
};
