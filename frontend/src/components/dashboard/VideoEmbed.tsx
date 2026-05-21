import { PlayCircle } from "lucide-react";

type VideoEmbedProps = {
  embedUrl: string;
};

const VideoEmbed = ({ embedUrl }: VideoEmbedProps) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-700/70 bg-black shadow-2xl shadow-black/50 ring-1 ring-orange-500/10">
    <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-orange-500/10 via-transparent to-violet-500/10 opacity-0 transition duration-500 group-hover:opacity-100" />

    <div className="relative z-0 aspect-video w-full">
      <iframe
        src={`${embedUrl}?rel=0&modestbranding=1`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>

    <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-xl border border-slate-700/60 bg-slate-950/80 px-3 py-2 backdrop-blur-xl sm:bottom-5 sm:left-5 sm:px-4">
      <div className="flex items-center gap-2 text-sm text-white">
        <PlayCircle className="h-4 w-4 text-orange-300" />
        AI Video Session
      </div>
    </div>
  </div>
);

export default VideoEmbed;
