/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#111111",
        darkGray: "#444444",
        mediumGray: "#777777",
        lightGray: "#E5E5E5",
        white: "#FFFFFF",
      },
      fontFamily: {
        sans: ['Inter', 'Open Sans', 'sans-serif'],
      },
      aspectRatio: {
        '16/9': '16 / 9',
      },
    },
  },
  plugins: [],
}
