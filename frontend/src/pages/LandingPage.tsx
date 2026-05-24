import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bolt,
  Brain,
  Clock3,
  FileAudio,
  Loader2,
  Play,
  Sparkles,
  Upload,
  Youtube,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { formatApiError } from "../utils/formatApiError";
import { BackendArchitecture } from "../components/landing/BackendArchitecture";
import { AnalyzingModal } from "../components/landing/AnalyzingModal";

type HistoryEntry = {
  video_id: string;
  title: string;
  summary: string | Record<string, unknown> | null;
  status?: "processing" | "chat_ready" | "error";
};


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

const getSummaryPreview = (summary: string | Record<string, unknown>): string => {
  if (typeof summary === "string") return summary.slice(0, 140);
  if (typeof summary?.tldr === "string") return summary.tldr.slice(0, 140);
  return "Click to view full analysis";
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"youtube" | "upload">("youtube");
  const [url, setUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploadJobId, setUploadJobId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const refreshHistory = () => {
    api.get("/youtube/history")
      .then((res) => {
        const data = res.data;
        setHistory(Array.isArray(data) ? data : []);
      })
      .catch(() => setHistory([]));
  };

  useEffect(() => {
    api.get("/youtube/history").then((res) => setHistory(res.data)).catch(() => {});
  }, []);

  // Re-poll history every 5s while any entry is still processing
  useEffect(() => {
    const hasProcessing = history.some((e) => e.status === "processing");
    if (!hasProcessing) return;
    const t = setInterval(refreshHistory, 5000);
    return () => clearInterval(t);
  }, [history]);

  useEffect(() => {
    if (!jobId) return;

    let polls = 0;
    const MAX_POLLS = 60; // 60 × 3s = 3 minutes max

    const interval = setInterval(async () => {
      polls += 1;

      // Give up after 2 minutes
      if (polls > MAX_POLLS) {
        clearInterval(interval);
        setJobId(null);
        setIsLoading(false);
        setError("Processing is taking too long. The video may be too long or the server is busy. Try uploading the file directly.");
        return;
      }

      try {
        const res = await api.get(`/youtube/status/${jobId}`);
        const data = res.data;

        if (data.status === "chat_ready") {
          clearInterval(interval);
          setJobId(null);
          setIsLoading(false);
          navigate("/dashboard", {
            state: {
              summary: data.summary,
              status: data.status,
              session_id: data.session_id,
              video_id: data.video_id,
              youtube_url: url.trim(),
            },
          });
        } else if (data.status === "error") {
          clearInterval(interval);
          setJobId(null);
          setIsLoading(false);
          setError(formatApiError({ response: { data: { detail: data.detail } } }, "Processing failed."));
        }
      } catch (err) {
        clearInterval(interval);
        setJobId(null);
        setIsLoading(false);
        setError(formatApiError(err, "Unable to check processing status."));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, navigate, url]);

  useEffect(() => {
    if (!uploadJobId) return;

    let polls = 0;
    const MAX_POLLS = 80; // 80 × 3s = 4 minutes max (uploads can take longer)

    const interval = setInterval(async () => {
      polls += 1;

      if (polls > MAX_POLLS) {
        clearInterval(interval);
        setUploadJobId(null);
        setIsLoading(false);
        setError("Processing is taking too long. Try a shorter file (under 45 minutes).");
        return;
      }

      try {
        const res = await api.get(`/upload/status/${uploadJobId}`);
        const data = res.data;

        if (data.status === "chat_ready") {
          clearInterval(interval);
          setUploadJobId(null);
          setIsLoading(false);
          navigate("/dashboard", {
            state: {
              summary: data.summary,
              status: data.status,
              session_id: data.session_id,
              video_id: data.video_id,
            },
          });
        } else if (data.status === "error") {
          clearInterval(interval);
          setUploadJobId(null);
          setIsLoading(false);
          setError(formatApiError({ response: { data: { detail: data.detail } } }, "Processing failed."));
        }
      } catch (err) {
        clearInterval(interval);
        setUploadJobId(null);
        setIsLoading(false);
        setError(formatApiError(err, "Unable to check processing status."));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [uploadJobId, navigate]);

  const handleHistoryClick = (entry: HistoryEntry) => {
    navigate("/dashboard", {
      state: {
        summary: entry.summary,
        status: "chat_ready",
        session_id: crypto.randomUUID(),
        video_id: entry.video_id,
        youtube_url: `https://www.youtube.com/watch?v=${entry.video_id}`,
      },
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) setUploadFile(dropped);
  };

  const canSubmit = useMemo(
    () => (tab === "youtube" ? url.trim().length > 0 : uploadFile !== null),
    [tab, url, uploadFile],
  );
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

    if (tab === "upload") {
      if (!uploadFile) return;
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", uploadFile);
        const response = await api.post("/upload/process", formData);
        const data = response.data;

        if (data.status === "chat_ready") {
          // Cache hit — navigate immediately
          navigate("/dashboard", {
            state: {
              summary: data.summary,
              status: data.status,
              session_id: data.session_id,
              video_id: data.video_id,
            },
          });
        } else if (data.status === "processing") {
          // Background task started — begin polling
          setStatus("Processing file… this may take a minute.");
          setUploadJobId(data.job_id);
          // keep isLoading true while polling
        }
      } catch (err) {
        setIsLoading(false);
        setError(formatApiError(err, "Unable to process the file. Please try again."));
      }
      return;
    }

    if (!validateYoutubeUrl(url)) {
      setError("Please paste a valid YouTube video link.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/youtube/process", { youtube_url: url.trim() });
      const data = response.data;

      if (data.status === "chat_ready") {
        // Cache hit — navigate immediately
        navigate("/dashboard", {
          state: {
            summary: data.summary,
            status: data.status,
            session_id: data.session_id,
            video_id: data.video_id,
            youtube_url: url.trim(),
          },
        });
      } else if (data.status === "processing") {
        // Background task started — begin polling
        setStatus("Analyzing video… this may take up to a minute.");
        setJobId(data.job_id);
        // keep isLoading true while polling
      }
    } catch (error) {
      setIsLoading(false);
      setError(formatApiError(error, "Unable to analyze the video. Please try again."));
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100">
      <LandingBackground />

      <AnalyzingModal
        open={isLoading}
        label={tab === "youtube" ? url.trim() || undefined : uploadFile?.name}
      />

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

                  {/* Tab switcher */}
                  <div className="flex gap-1 rounded-xl bg-slate-800/60 p-1">
                    <button
                      type="button"
                      onClick={() => { setTab("youtube"); setError(null); }}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition duration-200 ${
                        tab === "youtube"
                          ? "bg-slate-700 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <Youtube className="h-3.5 w-3.5" />
                      YouTube URL
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTab("upload"); setError(null); }}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition duration-200 ${
                        tab === "upload"
                          ? "bg-slate-700 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload File
                    </button>
                  </div>

                  {/* YouTube tab */}
                  {tab === "youtube" && (
                    <>
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
                    </>
                  )}

                  {/* Upload tab */}
                  {tab === "upload" && (
                    <>
                      <label
                        htmlFor="file-upload"
                        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 transition duration-300 ${
                          uploadFile
                            ? "border-orange-500/40 bg-orange-950/20"
                            : "border-slate-700/80 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900"
                        }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                      >
                        {uploadFile ? (
                          <>
                            <FileAudio className="h-8 w-8 text-orange-400" />
                            <div className="text-center">
                              <p className="text-sm font-medium text-slate-100">{uploadFile.name}</p>
                              <p className="mt-0.5 text-xs text-slate-500">{formatFileSize(uploadFile.size)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); setUploadFile(null); }}
                              className="text-xs text-slate-600 transition hover:text-red-400"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-slate-600" />
                            <div className="text-center">
                              <p className="text-sm text-slate-300">Drop file here or click to browse</p>
                              <p className="mt-1 text-xs text-slate-600">MP4, MOV, AVI, WebM, MP3, M4A, WAV, FLAC · Max ~45 min</p>
                            </div>
                          </>
                        )}
                        <input
                          id="file-upload"
                          type="file"
                          accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,.mkv,.m4v,audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/flac,.flac,.m4a,.aac"
                          className="sr-only"
                          onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={!canSubmit || isLoading}
                        className="inline-flex w-full min-h-[3.25rem] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 text-sm font-semibold text-white shadow-lg shadow-orange-900/30 transition duration-300 hover:from-orange-400 hover:to-orange-500 hover:shadow-orange-800/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Process file
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>

                      <p className="text-xs leading-relaxed text-slate-500 sm:text-sm">
                        Video files are converted to audio at 64 kbps before transcription. Large files may take up to 90 seconds.
                      </p>
                    </>
                  )}

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

        <AnimatePresence>
          {history.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-12"
            >
              <div className="mb-4 flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-400">Recently analyzed</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {history.slice(0, 6).map((entry, i) => {
                  const isProcessing = entry.status === "processing";
                  const isError = entry.status === "error";

                  return (
                    <motion.button
                      key={entry.video_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 + i * 0.06 }}
                      onClick={() => !isProcessing && !isError && handleHistoryClick(entry)}
                      disabled={isProcessing || isError}
                      className={`glass-panel group flex gap-3 rounded-xl p-3 text-left transition duration-300 ${
                        isProcessing || isError
                          ? "cursor-default opacity-75"
                          : "hover:border-orange-500/30 hover:bg-slate-800/60"
                      }`}
                    >
                      {/* Thumbnail with overlay for non-ready states */}
                      <div className="relative h-16 w-24 shrink-0">
                        <img
                          src={`https://img.youtube.com/vi/${entry.video_id}/mqdefault.jpg`}
                          alt=""
                          className="h-full w-full rounded-lg object-cover"
                        />
                        {isProcessing && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900/70">
                            <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
                          </div>
                        )}
                        {isError && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900/70">
                            <span className="text-xs text-red-400">✕</span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Status badge */}
                        {isProcessing && (
                          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-400 border border-orange-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                            Analyzing…
                          </span>
                        )}
                        {isError && (
                          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400 border border-red-500/20">
                            Failed
                          </span>
                        )}
                        <p className="truncate text-sm font-semibold text-slate-100">
                          {entry.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
                          {isProcessing
                            ? "Processing in background…"
                            : isError
                            ? "Analysis failed. Try resubmitting."
                            : getSummaryPreview(entry.summary ?? "")}
                        </p>
                      </div>

                      {!isProcessing && !isError && (
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-600 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-orange-400" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <BackendArchitecture />

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
