/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── PLANET MALL BRAND TOKENS ───────────────────────────────
      colors: {
        // Core brand
        rust:    "#C4531A", // primary accent — always
        gold:    "#D4A84B", // premium, highlights
        green:   "#2A6B45", // success, live, positive

        // Backgrounds
        void:    "#0A0908", // dark background
        cream:   "#F6F1E9", // light background
        paper:   "#F2EDE4", // text on dark

        // Text
        ink:     "#1A1714", // primary text on light
        muted:   "#8A8480", // secondary text

        // Phase-specific — kept as named tokens so phases can override
        "phase-1-bg":      "#0A0908",
        "phase-2-bg":      "#F6F1E9",
        "phase-3-bg":      "#F4EFE6",
        "phase-4-bg":      "#0D0C0B",
        "phase-5-bg":      "#08080A",
      },

      fontFamily: {
        // Phase 1: Syne (display) + DM Sans (body)
        syne:        ["Syne", "sans-serif"],
        "dm-sans":   ["DM Sans", "sans-serif"],

        // Phase 2: Playfair Display + DM Sans
        playfair:    ["Playfair Display", "serif"],

        // Phase 3: Fraunces + Figtree
        fraunces:    ["Fraunces", "serif"],
        figtree:     ["Figtree", "sans-serif"],

        // Phase 4: Cormorant Garamond + Instrument Sans
        cormorant:   ["Cormorant Garamond", "serif"],
        instrument:  ["Instrument Sans", "sans-serif"],

        // Phase 5: Clash Display + Satoshi
        clash:       ["Clash Display", "sans-serif"],
        satoshi:     ["Satoshi", "sans-serif"],
      },

      animation: {
        "fade-in":       "fadeIn 0.4s ease forwards",
        "slide-up":      "slideUp 0.5s ease forwards",
        "slide-right":   "slideRight 0.4s ease forwards",
        "pulse-dot":     "pulseDot 1.8s ease-in-out infinite",
        "ticker":        "ticker 25s linear infinite",
        "grain":         "grain 0.4s steps(1) infinite",
      },

      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":       { opacity: "0.4", transform: "scale(0.85)" },
        },
        ticker: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        grain: {
          "0%, 100%": { backgroundPosition: "0 0" },
          "20%":       { backgroundPosition: "-5% -10%" },
          "40%":       { backgroundPosition: "-15% 5%" },
          "60%":       { backgroundPosition: "7% -25%" },
          "80%":       { backgroundPosition: "-5% 10%" },
        },
      },
    },
  },
  plugins: [],
};
