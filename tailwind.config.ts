import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        scenario: {
          bg: "#0b0b0c",
          surface: "#121215",
          panel: "#17171b",
          card: "#1c1c21",
          border: "#26262d",
          accent: "#0099ff",
          accentHover: "#0080db",
          muted: "#9ca3af",
          text: "#f4f4f5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
