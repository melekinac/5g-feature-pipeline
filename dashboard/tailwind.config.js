/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: "class", 
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
  extend: {
  boxShadow: {
    soft: '0 2px 6px rgba(0,0,0,0.1)',
    dark: '0 2px 6px rgba(0,0,0,0.5)',
  },
}

}
,
  plugins: [],
};
