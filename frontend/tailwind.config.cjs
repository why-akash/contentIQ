module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Plus Jakarta Sans", "sans-serif"],
      },
      boxShadow: {
        glow: "0 30px 80px rgba(249, 115, 22, 0.14)",
        "glow-violet": "0 24px 60px rgba(139, 92, 246, 0.18)",
        card: "0 4px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
      },
      colors: {
        surface: "#0b1220",
        ink: {
          DEFAULT: "#070b14",
          soft: "#0d1322",
          card: "#111827",
        },
      },
      animation: {
        "aurora-1": "aurora-1 18s ease-in-out infinite",
        "aurora-2": "aurora-2 22s ease-in-out infinite",
        "aurora-3": "aurora-3 26s ease-in-out infinite",
        "grid-drift": "grid-drift 40s linear infinite",
        shimmer: "shimmer 3s ease-in-out infinite",
        "pulse-soft": "pulse-soft 4s ease-in-out infinite",
      },
      keyframes: {
        "aurora-1": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "50%": { transform: "translate(8%, -12%) scale(1.08)" },
        },
        "aurora-2": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "50%": { transform: "translate(-10%, 8%) scale(1.12)" },
        },
        "aurora-3": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1.05)" },
          "50%": { transform: "translate(6%, 10%) scale(0.95)" },
        },
        "grid-drift": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(48px)" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.85" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
