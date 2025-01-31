// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neumorphic-light': '#e0e5ec',
        'neumorphic-dark': '#1a1a1a',
      },
      boxShadow: {
        'neumorphic-light': '5px 5px 10px #a3b1c6, -5px -5px 10px #ffffff',
        'neumorphic-dark': '5px 5px 10px #0d0d0d, -5px -5px 10px #272727',
      },
    },
  },
  plugins: [],
}

export default config