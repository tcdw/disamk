/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 24px 70px -32px rgba(71, 39, 53, 0.38)",
      },
    },
    fontFamily: {
      sans: ["'Space Grotesk'", "'Microsoft YaHei'", "sans-serif"],
      mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
    },
  },
  daisyui: {
    logs: false,
    themes: [
      {
        disamk: {
          primary: "#b2456a",
          "primary-content": "#fff8fb",
          secondary: "#4b7597",
          "secondary-content": "#f6fbff",
          accent: "#d98752",
          "accent-content": "#fff7f1",
          neutral: "#2d1f27",
          "neutral-content": "#fff7fb",
          "base-100": "#fffaf8",
          "base-200": "#f7ece8",
          "base-300": "#e8d5ce",
          "base-content": "#2f2228",
          info: "#4c8dd9",
          success: "#4c8963",
          warning: "#d17b34",
          error: "#c9545d",
          "--rounded-box": "1.5rem",
          "--rounded-btn": "1rem",
          "--rounded-badge": "9999px",
          "--animation-btn": "0.2s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.99",
        },
      },
    ],
  },
  plugins: [require("daisyui"), require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
