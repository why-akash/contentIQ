import type { KeyConcept } from "../../types/dashboard";

type KeyConceptsSectionProps = {
  concepts: KeyConcept[];
};

const KeyConceptsSection = ({
  concepts,
}: KeyConceptsSectionProps) => {
  if (concepts.length === 0) return null;

  return (
    <section className="px-5 py-5 sm:px-7 sm:py-6">
      <h3 className="font-display text-base font-semibold text-white">
        Key Concepts
      </h3>
      <ul className="mt-4 space-y-3">
        {concepts.map(
          (concept, idx) => {
            const name =
              typeof concept === "string"
                ? concept
                : concept?.name ?? "";
            const description =
              typeof concept === "string"
                ? ""
                : concept?.description ?? "";

            if (!name) return null;

            return (
              <li
                key={idx}
                className="rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-3"
              >
                <p className="font-medium text-orange-200/90">
                  {name}
                </p>
                {description ? (
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    {description}
                  </p>
                ) : null}
              </li>
            );
          },
        )}
      </ul>
    </section>
  );
};

export default KeyConceptsSection;
