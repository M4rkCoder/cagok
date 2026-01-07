import tailwindcssAnimate from "tailwindcss-animate";

const config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      // ... (기존 설정과 동일)
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
