export type Message = {
  from: "user" | "ai";
  text: string;
  sources?: any[];
};

export type TldrInsights = {
  points: string[];
  highlights: string[];
};

export type KeyConcept =
  | {
      name?: string;
      description?: string;
    }
  | string;

export type DashboardLocationState = {
  summary?: string | Record<string, any>;
  status?: string;
  session_id?: string;
  video_id?: string;
  youtube_url?: string;
} | null;

export type DashboardInsights = {
  tldrInsights: TldrInsights | null;
  insightsKeyConcepts: KeyConcept[];
  insightsMainTakeaways: string[];
  insightsActionItems: string[];
  hasUnifiedInsights: boolean;
};
