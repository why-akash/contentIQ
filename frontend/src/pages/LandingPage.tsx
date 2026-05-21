import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bolt,
  Brain,
  Clock3,
  Loader2,
  Play,
  Sparkles,
  Youtube,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { formatApiError } from "../utils/formatApiError";


const features = [
  {
    icon: Bolt,
    title: "Summary, timestamps, Q&A in one place.",
    description: "Review the full video intelligence without switching screens.",
  },
  {
    icon: Clock3,
    title: "No extra steps.",
    description: "Paste, submit, and get instant structure in one workflow.",
  },
  {
    icon: Sparkles,
    title: "YouTube-first design.",
    description: "Built for video workflows and fast review on demand.",
  },
  {
    icon: Brain,
    title: "AI-powered understanding.",
    description: "Extract key insights, highlights, and context automatically.",
  },
];

const previewTimestamps = [
  { time: "0:00", label: "Introduction & context" },
  { time: "2:14", label: "Core concept explained" },
  { time: "5:48", label: "Key takeaway" },
];

const validateYoutubeUrl = (value: string) =>
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$/i.test(
    value.trim(),
  );

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

const LandingBackground = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,_#1e1b4b_0%,_transparent_50%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_100%_50%,_#431407_0%,_transparent_45%)] opacity-70" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_80%,_#312e81_0%,_transparent_50%)] opacity-60" />

    <div
      className="absolute -left-24 top-[12%] h-[28rem] w-[28rem] rounded-full bg-orange-500/25 blur-[100px] animate-aurora-1"
      aria-hidden
    />
    <div
      className="absolute right-[-8%] top-[35%] h-[32rem] w-[32rem] rounded-full bg-violet-600/20 blur-[110px] animate-aurora-2"
      aria-hidden
    />
    <div
      className="absolute bottom-[-10%] left-[30%] h-[26rem] w-[26rem] rounded-full bg-rose-600/15 blur-[90px] animate-aurora-3"
      aria-hidden
    />

    <div className="landing-grid absolute inset-0 animate-grid-drift opacity-80" aria-hidden />
    <div className="landing-grain absolute inset-0" aria-hidden />

    <div
      className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent"
      aria-hidden
    />
    <div
      className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink to-transparent"
      aria-hidden
    />
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => url.trim().length > 0, [url]);
  const asideRef = useRef<HTMLElement>(null);
  const [asideHeight, setAsideHeight] = useState<number | undefined>();

  useEffect(() => {
    const aside = asideRef.current;
    const leftColumn = aside?.previousElementSibling;
    if (!aside || !(leftColumn instanceof HTMLElement)) return;

    const lgQuery = window.matchMedia("(min-width: 1024px)");

    const syncHeight = () => {
      if (lgQuery.matches) {
        setAsideHeight(leftColumn.offsetHeight);
      } else {
        setAsideHeight(undefined);
      }
    };

    syncHeight();
    requestAnimationFrame(syncHeight);

    const observer = new ResizeObserver(syncHeight);
    observer.observe(leftColumn);
    lgQuery.addEventListener("change", syncHeight);
    window.addEventListener("resize", syncHeight);

    return () => {
      observer.disconnect();
      lgQuery.removeEventListener("change", syncHeight);
      window.removeEventListener("resize", syncHeight);
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (!validateYoutubeUrl(url)) {
      setError("Please paste a valid YouTube video link.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post(
        "/youtube/process",
        {
          youtube_url: url.trim(),
        },
        {
          timeout: 20000,
        },
      );

      const { summary, status: responseStatus, session_id, video_id } = response.data;
      setStatus(
        summary
          ? "Video analyzed. Summary and timestamps are ready."
          : `Video processed. ${responseStatus ?? "AI answers will appear soon."}`,
      );
      navigate("/dashboard", {
        state: {
          summary,
          status: responseStatus,
          session_id,
          video_id,
          youtube_url: url.trim(),
        },
      });
    } catch (error) {
      setError(
        formatApiError(
          error,
          "Unable to analyze the video. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100">
      <LandingBackground />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-panel mb-8 flex flex-col gap-4 rounded-2xl px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 lg:mb-12"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-rose-500/10 text-orange-300 ring-1 ring-orange-400/25">
              <Youtube className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-400 animate-pulse-soft" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-white">
                ContentIQ
              </p>
              <p className="text-xs text-slate-500">YouTube video intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Zap className="h-4 w-4 text-orange-400/80" />
            <span>Paste a link — get structure in seconds</span>
          </div>
        </motion.header>

        <main className="grid flex-1 gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-12 xl:gap-16">
          <section className="flex flex-col justify-center">
            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.08 } } }}
              initial="hidden"
              animate="show"
              className="space-y-6 sm:space-y-8"
            >
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                  Instant video analysis
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="font-display max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]"
              >
                Turn any YouTube link into{" "}
                <span className="hero-gradient-text">summary, timestamps,</span> and AI answers.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg"
              >
                One input, one results screen. Paste a URL and review structured insights
                without jumping between tools.
              </motion.p>

              <motion.form
                variants={fadeUp}
                custom={3}
                onSubmit={handleSubmit}
                className="glass-panel group relative overflow-hidden rounded-2xl p-5 sm:p-6 lg:p-7"
              >
                <div
                  className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-violet-500/0 opacity-0 transition-opacity duration-500 group-focus-within:opacity-100"
                  aria-hidden
                />

                <div className="relative space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                    <label htmlFor="youtube-url" className="sr-only">
                      YouTube video URL
                    </label>
                    <div className="relative min-w-0 flex-1">
                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Youtube className="h-4 w-4" />
                      </div>
                      <input
                        id="youtube-url"
                        type="url"
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-3.5 pl-11 pr-4 text-slate-100 outline-none transition duration-300 placeholder:text-slate-600 focus:border-orange-400/60 focus:bg-slate-900 focus:ring-2 focus:ring-orange-500/15 sm:min-h-[3.25rem]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!canSubmit || isLoading}
                      className="inline-flex min-h-[3.25rem] shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 text-sm font-semibold text-white shadow-lg shadow-orange-900/30 transition duration-300 hover:from-orange-400 hover:to-orange-500 hover:shadow-orange-800/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:px-7"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Analyze video
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-500 sm:text-sm">
                    YouTube URLs only. Results include summary, chapter timestamps, and
                    chat-ready Q&amp;A on the next screen.
                  </p>

                  <AnimatePresence mode="wait">
                    {error ? (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden rounded-xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-200"
                      >
                        {error}
                      </motion.div>
                    ) : null}

                    {status ? (
                      <motion.div
                        key="status"
                        initial={{ opacity: 0, y: 8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden rounded-xl border border-orange-500/25 bg-orange-950/30 px-4 py-3 text-sm text-orange-100"
                      >
                        {status}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </motion.form>
            </motion.div>
          </section>

          <aside
            ref={asideRef}
            className="flex w-full lg:shrink-0 lg:overflow-hidden"
            style={
              asideHeight !== undefined
                ? { height: asideHeight, maxHeight: asideHeight }
                : undefined
            }
          >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel relative flex h-full max-h-full w-full flex-col overflow-hidden rounded-2xl p-5 sm:p-6 lg:p-5"
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl"
                aria-hidden
              />

              <div className="relative shrink-0">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Preview
                    </p>
                    <p className="font-display text-base font-semibold text-white">
                      What you&apos;ll get
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 text-orange-300 ring-1 ring-slate-700">
                    <Play className="h-3.5 w-3.5 fill-current" />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-3">
                  <div className="flex gap-2.5">
                    <div className="h-10 w-16 shrink-0 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 ring-1 ring-slate-600/50" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="h-2 w-4/5 max-w-[160px] rounded-full bg-slate-600/80 animate-shimmer" />
                      <div className="h-1.5 w-3/5 max-w-[100px] rounded-full bg-slate-700/80" />
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-slate-500 line-clamp-1">
                    Auto-generated summary with key points from the transcript…
                  </p>
                  <ul className="mt-2 space-y-1.5 border-t border-slate-700/50 pt-2">
                    {previewTimestamps.map((item, index) => (
                      <motion.li
                        key={item.time}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + index * 0.1 }}
                        className="flex items-center gap-2 text-[11px]"
                      >
                        <span className="shrink-0 rounded bg-orange-500/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-orange-300">
                          {item.time}
                        </span>
                        <span className="truncate text-slate-400">{item.label}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="my-3 h-px shrink-0 bg-gradient-to-r from-transparent via-slate-700/80 to-transparent" />

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="mb-2 flex shrink-0 items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  <h2 className="font-display text-xs font-semibold text-slate-300">
                    Built for speed
                  </h2>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.08, duration: 0.4 }}
                      className="flex items-center gap-2.5 rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2.5 transition-colors duration-300 hover:border-slate-600/70 hover:bg-slate-900/60"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-800/90 text-orange-300 ring-1 ring-slate-700/80">
                        <feature.icon className="h-3.5 w-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-xs font-semibold text-slate-100">
                          {feature.title}
                        </h3>

                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </aside>
        </main>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 border-t border-slate-800/60 pt-6 text-center text-xs text-slate-600 sm:mt-14"
        >
          ContentIQ — structured insights from YouTube, on demand.
        </motion.footer>
      </div>
    </div>
  );
};

export default LandingPage;
