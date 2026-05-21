import type { TldrInsights } from "../../types/dashboard";

type SmartSummarySectionProps = {
  tldrInsights: TldrInsights;
};

const SmartSummarySection = ({
  tldrInsights,
}: SmartSummarySectionProps) => {
  if (
    tldrInsights.points.length === 0 &&
    tldrInsights.highlights.length === 0
  ) {
    return null;
  }

  return (
    <section className="px-5 py-5 sm:px-7 sm:py-6">
      <h3 className="font-display text-base font-semibold text-white">
        Smart Summary
      </h3>

      {tldrInsights.points.length > 0 && (
        <ol className="mt-4 space-y-3">
          {tldrInsights.points.map(
            (point, idx) => (
              <li
                key={idx}
                className="flex gap-3 text-[15px] leading-relaxed text-slate-300"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-orange-500/15 font-mono text-xs font-semibold text-orange-300">
                  {idx + 1}
                </span>
                <span>{point}</span>
              </li>
            ),
          )}
        </ol>
      )}

      {tldrInsights.highlights.length >
        0 && (
        <div className="mt-5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Highlights
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {tldrInsights.highlights.map(
              (item, idx) => (
                <li key={idx}>
                  <span className="inline-flex rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-sm leading-snug text-orange-100/90">
                    {item}
                  </span>
                </li>
              ),
            )}
          </ul>
        </div>
      )}
    </section>
  );
};

export default SmartSummarySection;
