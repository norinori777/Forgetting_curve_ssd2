import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { Config } from 'tailwindcss';

const themePath = path.resolve(__dirname, '../theme.json');
const themeJson = JSON.parse(readFileSync(themePath, 'utf8')) as {
  tailwind?: { theme?: { extend?: Record<string, unknown> } };
};

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: themeJson.tailwind?.theme?.extend ?? {},
  },
};

export default config;