type InsightListSectionProps = {
  title: string;
  data: string[] | undefined;
  variant?: "cyan" | "green";
  layout?: "list" | "chips";
};

const InsightListSection = ({
  title,
  data,
  variant,
  layout = "list",
}: InsightListSectionProps) => {
  if (
    !Array.isArray(data) ||
    data.length === 0
  )
    return null;

  return (
    <section className="px-5 py-5 sm:px-7 sm:py-6">
      <h2
        className={`font-display text-lg font-semibold text-white ${
          variant === "green" ? "text-emerald-100" : ""
        }`}
      >
        {title}
      </h2>

      {layout === "chips" ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {data.map((item, idx) => (
            <li key={idx} className="max-w-full">
              <span className="inline-flex rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-1.5 text-sm leading-snug text-slate-300 ring-1 ring-orange-500/10">
                {item}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-4 space-y-3">
          {data.map((item, idx) => (
            <li
              key={idx}
              className="flex gap-3 text-[15px] leading-relaxed text-slate-300"
            >
              <span
                className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                  variant === "green"
                    ? "bg-emerald-400"
                    : "bg-orange-400"
                }`}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default InsightListSection;
