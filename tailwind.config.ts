import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — sampled from MedicomAI主题色.png (top-left = primary)
        brand: {
          sky: "#87D2E7", // primary
          light: "#A3D0E3",
          deep: "#1977C9", // primary CTA / deep blue
          gray: "#808080",
          vital: "#10B981", // vital-sign green accent
          50: "#f2fafd",
          100: "#e2f3f9",
          200: "#c2e6f2",
          300: "#87D2E7",
          400: "#5bbbdd",
          500: "#33a0cf",
          600: "#1977C9",
          700: "#1863a8",
          800: "#195187",
          900: "#19446e",
          950: "#112b48",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Noto Sans SC",
          "sans-serif",
        ],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(25, 119, 201, 0.18)",
        card: "0 4px 24px -8px rgba(17, 43, 72, 0.12)",
        glow: "0 0 60px -12px rgba(135, 210, 231, 0.55)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #87D2E7 0%, #1977C9 100%)",
        "brand-radial":
          "radial-gradient(60% 60% at 50% 0%, rgba(135,210,231,0.35) 0%, rgba(255,255,255,0) 70%)",
        "grid-faint":
          "linear-gradient(to right, rgba(25,119,201,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(25,119,201,0.06) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
