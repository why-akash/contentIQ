const DashboardBackground = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,_#1e1b4b_0%,_transparent_50%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_100%_50%,_#431407_0%,_transparent_45%)] opacity-70" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_80%,_#312e81_0%,_transparent_50%)] opacity-60" />
    <div
      className="absolute -left-24 top-[8%] h-[24rem] w-[24rem] rounded-full bg-orange-500/20 blur-[100px] animate-aurora-1"
      aria-hidden
    />
    <div
      className="absolute right-[-6%] top-[30%] h-[28rem] w-[28rem] rounded-full bg-violet-600/18 blur-[110px] animate-aurora-2"
      aria-hidden
    />
    <div
      className="absolute bottom-[-8%] left-[25%] h-[22rem] w-[22rem] rounded-full bg-rose-600/12 blur-[90px] animate-aurora-3"
      aria-hidden
    />
    <div className="landing-grid absolute inset-0 animate-grid-drift opacity-60" aria-hidden />
    <div className="landing-grain absolute inset-0" aria-hidden />
    <div
      className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/35 to-transparent"
      aria-hidden
    />
  </div>
);

export default DashboardBackground;
