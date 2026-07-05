/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  corePlugins: {
    // Angular Material and Bootstrap's grid already establish base element
    // styles; Tailwind's reset would fight both, so utilities-only here.
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
}

