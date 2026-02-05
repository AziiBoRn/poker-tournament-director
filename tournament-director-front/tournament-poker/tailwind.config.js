/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        poker: {
          dark: '#1b1f28',   // Fond principal (sombre)
          card: '#242a36',   // Fond des cartes/blocs
          accent: '#ff5a00', // Orange type Winamax
          text: '#eef2f6',   // Texte clair
          muted: '#64748b',  // Texte gris
          table: '#2c3e50',  // Fond des tables vertes/bleues
          bg: '#12141a',     // Fond encore plus sombre
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}