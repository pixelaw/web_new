/** @type {import('tailwindcss').Config} */
// import type { Config } from "tailwindcss";

const config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': "#2f1643",
        'header-primary': "#171717",
      }
    },
  },
  plugins: [],
}

export default config;
