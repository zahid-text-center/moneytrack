/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF6",
        surface: "#FFFFFF",
        ink: "#16241E",
        muted: "#6B7A70",
        line: "#E4E1D6",
        ledger: "#1F7A5C",
        ledgerDark: "#155A43",
        gold: "#C08A2E",
        rust: "#B3452C",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
