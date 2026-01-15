import tailwindcssAnimate from "tailwindcss-animate";

const config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        pretendard: ["Pretendard", "sans-serif"],
        intertab: ["InterTab", "monospace"],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
