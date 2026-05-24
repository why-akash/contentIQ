import { AnimatePresence, motion } from "framer-motion";
import { Brain, Database, FileText, Mic2, Sparkles } from "lucide-react";

const STEPS = [
  { icon: FileText, label: "Fetching transcript",      color: "#38bdf8" },
  { icon: Mic2,     label: "Transcribing audio",       color: "#a78bfa" },
  { icon: Brain,    label: "Generating summary",        color: "#f97316" },
  { icon: Database, label: "Indexing for chat",         color: "#34d399" },
  { icon: Sparkles, label: "Almost ready…",             color: "#fb7185" },
];

interface Props {
  open: boolean;
  label?: string; // e.g. the YouTube URL or file name
  step?: number;  // 0-4, driven by real backend progress
}

export function AnalyzingModal({ open, label, step = 0 }: Props) {
  const currentStep = Math.min(Math.max(step, 0), STEPS.length - 1);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="analyzing-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(6px)", background: "rgba(2,4,16,0.72)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm rounded-2xl border border-slate-700/60 bg-slate-900/95 p-7 shadow-2xl"
          >
            {/* Pulsing ring + icon */}
            <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${STEPS[currentStep].color}40` }}
                animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${STEPS[currentStep].color}25` }}
                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              />
              <div
                className="relative flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: `${STEPS[currentStep].color}18`, border: `1.5px solid ${STEPS[currentStep].color}40` }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.2 }}
                  >
                    {(() => {
                      const Icon = STEPS[currentStep].icon;
                      return <Icon className="h-5 w-5" style={{ color: STEPS[currentStep].color }} />;
                    })()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Title */}
            <h2 className="mb-1 text-center text-base font-semibold text-white">
              Analyzing your video
            </h2>

            {/* Current step label */}
            <AnimatePresence mode="wait">
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="mb-5 text-center text-sm"
                style={{ color: STEPS[currentStep].color }}
              >
                {STEPS[currentStep].label}
              </motion.p>
            </AnimatePresence>

            {/* Step dots */}
            <div className="mb-5 flex items-center justify-center gap-2">
              {STEPS.map((s, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === currentStep ? 20 : 6,
                    backgroundColor: i <= currentStep ? s.color : "#334155",
                    opacity: i <= currentStep ? 1 : 0.4,
                  }}
                  transition={{ duration: 0.35 }}
                  className="h-1.5 rounded-full"
                />
              ))}
            </div>

            {/* Source label */}
            {label && (
              <p className="truncate rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-center text-[11px] text-slate-500">
                {label}
              </p>
            )}

            <p className="mt-3 text-center text-[11px] text-slate-600">
              This usually takes 20–60 seconds
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
