import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'coffee-dark': '#3E2723',
        'coffee-medium': '#6D4C41',
        'coffee-light': '#A1887F',
        'cream': '#EFEBE9',
      },
    },
  },
  plugins: [],
}
export default config
