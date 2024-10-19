/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './views/**/*.ejs',
    './views/**/*.html',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
}

