/*
 * Tailwind runs through PostCSS here rather than through the Vite plugin the
 * other apps use, because Next.js owns the CSS pipeline in this app.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
