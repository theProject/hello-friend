import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class', // Enable dark mode via a class on the root element (e.g., <html class="dark">)
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Remove neumorphic colors and shadows.
      // If desired, you can add custom glass or gradient colors here.
      // For example:
      // colors: {
      //   'glass-light': 'rgba(255, 255, 255, 0.3)',
      //   'glass-dark': 'rgba(31,41,55,0.25)',
      // },
    },
  },
  plugins: [],
}

export default config;
