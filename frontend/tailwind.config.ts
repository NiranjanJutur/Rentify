import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-surface-variant": "#444651",
        "primary": "#00236f",
        "outline-variant": "#c5c5d3",
        "inverse-surface": "#2e3132",
        "on-tertiary-fixed-variant": "#773205",
        "on-secondary-fixed-variant": "#005236",
        "surface-bright": "#f8f9fb",
        "on-surface": "#191c1e",
        "on-tertiary-fixed": "#341100",
        "surface-variant": "#e1e2e4",
        "on-background": "#191c1e",
        "surface-dim": "#d9dadc",
        "primary-fixed-dim": "#b6c4ff",
        "surface-container": "#edeef0",
        "tertiary-container": "#6e2c00",
        "surface-tint": "#4059aa",
        "on-primary-container": "#90a8ff",
        "on-secondary": "#ffffff",
        "error-container": "#ffdad6",
        "error": "#ba1a1a",
        "inverse-on-surface": "#f0f1f3",
        "secondary-container": "#6cf8bb",
        "secondary-fixed": "#6ffbbe",
        "on-primary": "#ffffff",
        "primary-container": "#1e3a8a",
        "inverse-primary": "#b6c4ff",
        "primary-fixed": "#dce1ff",
        "tertiary-fixed": "#ffdbcb",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        "tertiary": "#4b1c00",
        "surface-container-high": "#e7e8ea",
        "surface-container-low": "#f3f4f6",
        "secondary-fixed-dim": "#4edea3",
        "secondary": "#006c49",
        "on-primary-fixed": "#00164e",
        "on-primary-fixed-variant": "#264191",
        "on-secondary-fixed": "#002113",
        "tertiary-fixed-dim": "#ffb691",
        "surface-container-highest": "#e1e2e4",
        "surface": "#f8f9fb",
        "on-tertiary": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "on-tertiary-container": "#f39461",
        "on-secondary-container": "#00714d",
        "outline": "#757682",
        "background": "#f8f9fb"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      fontFamily: {
        "headline": ["var(--font-manrope)"],
        "body": ["var(--font-inter)"],
        "label": ["var(--font-inter)"],
        "sans": ["var(--font-inter)"]
      }
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/container-queries")],
};
export default config;
