import themeJson from '../../../../theme.json';

type ThemeJson = {
  tailwind?: {
    theme?: {
      extend?: {
        colors?: Record<string, unknown>;
        fontFamily?: Record<string, string[]>;
        fontSize?: Record<string, string>;
        spacing?: Record<string, string>;
        borderRadius?: Record<string, string>;
        screens?: Record<string, string>;
      };
    };
  };
};

type ThemeExtend = {
  colors?: Record<string, unknown>;
  fontFamily?: Record<string, string[]>;
  fontSize?: Record<string, string>;
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  screens?: Record<string, string>;
};

function getColor(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

const rawTokens = ((themeJson as ThemeJson).tailwind?.theme?.extend ?? {}) as ThemeExtend & {
  colors?: Record<string, Record<string, string>>;
};

const rawColors = rawTokens.colors ?? {};
const textColors = rawColors.text ?? {};
const surfaceColors = rawColors.surface ?? {};

export const themeTokens = {
  ...rawTokens,
  colors: {
    ...rawColors,
    text: {
      ...textColors,
      muted: getColor(textColors.secondary, 'rgb(85, 85, 85)'),
    },
    surface: {
      ...surfaceColors,
      panel: getColor(surfaceColors.base, 'rgb(255, 255, 255)'),
    },
    brand: {
      primary: getColor(surfaceColors.accent, 'rgb(45, 140, 60)'),
      secondary: getColor(surfaceColors.muted, 'rgb(240, 240, 238)'),
    },
    border: {
      subtle: getColor(surfaceColors.muted, 'rgb(240, 240, 238)'),
      strong: getColor(textColors.secondary, 'rgb(85, 85, 85)'),
    },
    status: {
      danger: 'rgb(186, 47, 47)',
      success: getColor(surfaceColors.accent, 'rgb(45, 140, 60)'),
      warning: 'rgb(176, 115, 0)',
    },
  },
};