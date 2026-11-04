import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        plum: { DEFAULT: "#4A1D5E", 600: "#5B2A72", 50: "#F5EEF8" },
        orchid: "#7B3F98",
        lilac: "#EFE6F5",
        coral: { DEFAULT: "#F26D5B", soft: "#FDE4DF", text: "#C2493A" },
        blush: "#FFF6F2",
        teal: { DEFAULT: "#1F8A82", soft: "#DDF1EE", deep: "#176B65" },
        gold: { DEFAULT: "#F5B83D", soft: "#FDF0D3" },
        ink: "#1E1726",
        muted: "#6B6177",
        line: "#E6DDEB",
        alert: "#D93F4C",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: { card: "0 1px 2px rgba(30,23,38,.04), 0 8px 24px rgba(74,29,94,.06)" },
      borderRadius: { xl: "1rem", xl2: "1.25rem" },
    },
  },
  plugins: [],
};

export default config;
