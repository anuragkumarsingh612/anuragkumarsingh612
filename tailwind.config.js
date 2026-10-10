export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b0b0c",
        surface: "#18181b",
        border: "#2c2c31",
        text: "#e5e5ea",
        muted: "#8b8b95",
        accent: "#8ab4ff",
      },
      borderRadius: { "2xl": "20px" },
      fontFamily: { sans: ["Manrope Variable", "sans-serif"] },
    },
  },
  plugins: [],
};
