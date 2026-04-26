import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211d",
        paper: "#f8faf8",
        moss: "#4d7c5f",
        harbor: "#285a77",
        coral: "#c95f4b"
      }
    }
  },
  plugins: []
};

export default config;
