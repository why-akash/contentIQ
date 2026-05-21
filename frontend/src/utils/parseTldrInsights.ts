import type { TldrInsights } from "../types/dashboard";

export const parseTldrInsights = (
  tldr: unknown,
): TldrInsights | null => {
  if (tldr == null) return null;

  const fromObject = (
    obj: Record<string, unknown>,
  ): TldrInsights | null => {
    const points = Array.isArray(obj.points)
      ? obj.points
          .map((point) => String(point).trim())
          .filter(Boolean)
          .slice(0, 3)
      : typeof obj.summary === "string" &&
          obj.summary.trim()
        ? [obj.summary.trim()]
        : [];

    const highlights = Array.isArray(obj.highlights)
      ? obj.highlights
          .map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 4)
      : [];

    if (!points.length && !highlights.length) {
      return null;
    }

    return { points, highlights };
  };

  if (typeof tldr === "object") {
    return fromObject(
      tldr as Record<string, unknown>,
    );
  }

  if (typeof tldr === "string") {
    const trimmed = tldr.trim();

    if (
      trimmed.startsWith("{") ||
      trimmed.startsWith("```")
    ) {
      try {
        const cleaned = trimmed
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "");

        const parsed = JSON.parse(cleaned);

        if (parsed?.tldr) {
          return parseTldrInsights(parsed.tldr);
        }

        if (parsed?.points || parsed?.highlights) {
          return fromObject(parsed);
        }
      } catch {
        /* use plain text fallback */
      }
    }

    if (trimmed) {
      return { points: [trimmed], highlights: [] };
    }
  }

  return null;
};
