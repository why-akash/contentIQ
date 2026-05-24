import { motion } from "framer-motion";
import { Brain, Database, Layers, MessageSquare, Mic2, Zap } from "lucide-react";

const C = {
  orange:   "#f97316",
  violet:   "#a78bfa",
  sky:      "#38bdf8",
  emerald:  "#34d399",
  rose:     "#fb7185",
};

// Animated flowing dashed path
function Flow({ d, color, delay = 0 }: { d: string; color: string; delay?: number }) {
  return (
    <motion.path
      d={d}
      stroke={color}
      strokeWidth={1.5}
      fill="none"
      strokeDasharray="6 4"
      animate={{ strokeDashoffset: [0, -10] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear", delay }}
    />
  );
}

// Node box with optional subtitle
function Box({
  x, y, w, h, label, sub, stroke,
}: {
  x: number; y: number; w: number; h: number;
  label: string; sub?: string; stroke: string;
}) {
  return (
    <g>
      <rect
        x={x} y={y} width={w} height={h} rx={8}
        fill="#0f172a" stroke={stroke} strokeWidth={1.5}
      />
      <text
        x={x + w / 2} y={y + (sub ? h / 2 - 7 : h / 2 + 1)}
        textAnchor="middle" dominantBaseline="middle"
        fill="#f1f5f9" fontSize={11.5} fontWeight={600}
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2} y={y + h / 2 + 9}
          textAnchor="middle" dominantBaseline="middle"
          fill={stroke} fontSize={9.5} opacity={0.85}
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

// Small edge label
function EL({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  return (
    <text
      x={x} y={y} textAnchor="middle"
      fill={color} fontSize={9} opacity={0.9}
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      {text}
    </text>
  );
}

const steps = [
  {
    icon: Layers,
    num: "01",
    color: C.orange,
    title: "Dual Input",
    desc: "YouTube URL or direct file upload (MP4, MOV, MP3, WAV, FLAC). Video files are auto-converted to 64 kbps MP3 via ffmpeg before transcription.",
  },
  {
    icon: Mic2,
    num: "02",
    color: C.violet,
    title: "Smart Transcription",
    desc: "Three-tier fallback: YT Transcript API (primary) → Supadata API (when IP-blocked or captions missing) → yt-dlp + Groq Whisper-large-v3-turbo (last resort or file uploads).",
  },
  {
    icon: Brain,
    num: "03",
    color: C.sky,
    title: "Adaptive Summarization",
    desc: "tiktoken counts tokens. Under 8 k: single Groq LLaMA call. Over 8 k: map-reduce — chunk → summarise each → reduce to one final JSON object.",
  },
  {
    icon: Database,
    num: "04",
    color: C.emerald,
    title: "Semantic Indexing",
    desc: "Segments chunked into 2-min windows, embedded with ONNX MiniLM-L6-v2, and persisted in ChromaDB keyed by video_id.",
  },
  {
    icon: MessageSquare,
    num: "05",
    color: C.orange,
    title: "Contextual Chat",
    desc: "MMR retrieval (k=5, fetch_k=15) pulls the most relevant chunks. Per-session memory + follow-up rewriting + Groq LLaMA generate timestamp-aware answers.",
  },
];

export const BackendArchitecture = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.6 }}
      className="mt-20"
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200 mb-4">
          <Zap className="h-3 w-3" />
          System architecture
        </span>
        <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
          Full pipeline, under the hood
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto">
          From URL or file to structured summary and chat — every step, every fallback.
        </p>
      </div>

      {/* Diagram */}
      <div className="glass-panel rounded-2xl p-3 sm:p-5 overflow-hidden">
        <svg
          viewBox="0 0 880 630"
          width="100%"
          style={{ overflow: "visible", display: "block" }}
        >
          {/* ── INPUT LAYER ── */}
          <Box x={45}  y={18} w={210} h={52} label="YouTube URL"  sub="/youtube/process"  stroke={C.orange} />
          <Box x={625} y={18} w={210} h={52} label="File Upload"   sub="/upload/process"   stroke={C.orange} />

          {/* ── ffmpeg node for video uploads ── */}
          <Box x={584} y={78} w={195} h={30} label="ffmpeg 64kbps mp3" stroke={C.rose} />

          {/* ── TRANSCRIPTION LAYER (three-tier cascade left→right) ── */}
          <Box x={5}   y={122} w={155} h={50} label="YT Transcript API"  sub="primary · captions"       stroke={C.emerald} />
          <Box x={183} y={122} w={130} h={50} label="Supadata API"        sub="tier-2 · IP blocked"      stroke={C.sky}     />
          <Box x={336} y={122} w={130} h={50} label="yt-dlp + ffmpeg"     sub="tier-3 · audio download"  stroke={C.rose}    />
          <Box x={562} y={122} w={245} h={50} label="Groq Whisper"        sub="whisper-large-v3-turbo"   stroke={C.violet}  />

          {/* ── SEGMENTS ── */}
          <Box x={328} y={228} w={224} h={44} label="Transcript Segments" sub="{text, start, duration}[]" stroke={C.sky} />

          {/* ── PARALLEL: ChromaDB (left) + Router (center) ── */}
          <Box x={10}  y={312} w={215} h={76} label="MiniLM-L6-v2 Embeddings"  sub="→ ChromaDB  (video_id collection)"  stroke={C.emerald} />
          <Box x={295} y={312} w={290} h={44} label="tiktoken Token Router"     sub=""                                    stroke={C.sky}     />

          {/* ── LLM PATHS ── */}
          <Box x={140} y={394} w={195} h={44} label="Single LLM Call" sub="< 8 000 tokens" stroke={C.orange} />
          <Box x={545} y={394} w={195} h={44} label="Map-Reduce"      sub="≥ 8 000 tokens" stroke={C.orange} />

          {/* ── SUMMARY + CACHE ── */}
          <Box x={278} y={474} w={322} h={52} label="Groq LLaMA 3.1 — Summary JSON"       sub="tldr · key_concepts · takeaways · action_items" stroke={C.violet} />
          <Box x={618} y={474} w={210} h={52} label="JSON Cache"                           sub="repeat requests skip transcription"              stroke={C.rose}   />

          {/* ── CHAT ── */}
          <Box x={245} y={558} w={390} h={52} label="/chat/  —  MMR + session memory" sub="k=5  fetch_k=15  ·  Groq LLaMA 3.1  ·  timestamp-aware" stroke={C.orange} />

          {/* ══════ FLOWS ══════ */}

          {/* YouTube → YT API (primary fast path) */}
          <Flow d="M 150 70 C 150 95 82 95 82 122" color={C.emerald} delay={0} />
          <EL x={90} y={93} text="fast path" color={C.emerald} />

          {/* YT API → Supadata (tier-2: IP blocked / missing captions) — arc below boxes */}
          <Flow d="M 160 147 C 160 185 183 185 183 147" color={C.sky} delay={0.15} />
          <EL x={171} y={192} text="IP blocked" color={C.sky} />

          {/* Supadata → yt-dlp (tier-3: Supadata API fails) — arc below boxes */}
          <Flow d="M 313 147 C 313 185 336 185 336 147" color={C.rose} delay={0.3} />
          <EL x={324} y={192} text="API fails" color={C.rose} />

          {/* yt-dlp → Groq Whisper (download audio → transcribe) */}
          <Flow d="M 466 147 L 562 147" color={C.violet} delay={0.45} />
          <EL x={514} y={140} text="mp3 audio" color={C.violet} />

          {/* File Upload → ffmpeg (if video file) */}
          <Flow d="M 730 70 C 730 75 681 75 681 78" color={C.rose} delay={0} />
          <EL x={706} y={72} text="if video" color={C.rose} />

          {/* ffmpeg → Groq Whisper */}
          <Flow d="M 681 108 L 681 122" color={C.rose} delay={0.1} />

          {/* File Upload → Groq Whisper (if audio, no ffmpeg needed) */}
          <Flow d="M 800 70 L 800 122" color={C.violet} delay={0} />
          <EL x={820} y={96} text="if audio" color={C.violet} />

          {/* YT API → Segments (success) */}
          <Flow d="M 82 172 C 82 208 390 228 390 228" color={C.sky} delay={0} />

          {/* Supadata → Segments (success) */}
          <Flow d="M 248 172 C 248 210 420 228 420 228" color={C.sky} delay={0.1} />

          {/* Groq Whisper → Segments */}
          <Flow d="M 684 172 C 684 208 502 228 502 228" color={C.sky} delay={0.15} />

          {/* Segments → ChromaDB */}
          <Flow d="M 328 250 C 218 250 117 290 117 312" color={C.emerald} delay={0.1} />
          <EL x={198} y={268} text="embed + store" color={C.emerald} />

          {/* Segments → tiktoken */}
          <Flow d="M 440 272 L 440 312" color={C.sky} delay={0} />

          {/* tiktoken → Single LLM */}
          <Flow d="M 355 356 C 355 378 237 378 237 394" color={C.orange} delay={0.1} />
          <EL x={282} y={372} text="< 8k" color={C.orange} />

          {/* tiktoken → Map-Reduce */}
          <Flow d="M 525 356 C 525 378 637 378 637 394" color={C.orange} delay={0.2} />
          <EL x={597} y={372} text="≥ 8k" color={C.orange} />

          {/* Single LLM → Summary */}
          <Flow d="M 237 438 C 237 460 336 474 336 474" color={C.violet} delay={0.1} />

          {/* Map-Reduce → Summary */}
          <Flow d="M 637 438 C 637 460 556 474 556 474" color={C.violet} delay={0.2} />

          {/* Summary → JSON Cache */}
          <Flow d="M 600 500 L 618 500" color={C.rose} delay={0} />

          {/* ChromaDB → Chat */}
          <Flow d="M 117 388 C 117 492 245 578 245 578" color={C.emerald} delay={0.2} />

          {/* Summary → Chat */}
          <Flow d="M 439 526 L 439 558" color={C.orange} delay={0} />

        </svg>
      </div>

      {/* Step cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.07 }}
            className="glass-panel rounded-xl p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                style={{
                  backgroundColor: `${step.color}18`,
                  borderColor: `${step.color}40`,
                }}
              >
                <step.icon className="h-3.5 w-3.5" style={{ color: step.color }} />
              </div>
              <span className="font-mono text-xs text-slate-600">{step.num}</span>
            </div>
            <h3 className="mb-1 text-sm font-semibold text-white">{step.title}</h3>
            <p className="text-[11px] leading-relaxed text-slate-500">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default BackendArchitecture;
