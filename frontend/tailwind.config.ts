import type { Config } from 'tailwindcss';
import { tailwindTheme } from './src/utils/theme/tailwindTheme';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: tailwindTheme,
  },
};

export default config;