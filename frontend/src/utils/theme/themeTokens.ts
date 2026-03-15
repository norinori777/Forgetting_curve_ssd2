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

export const themeTokens = (themeJson as ThemeJson).tailwind?.theme?.extend ?? {};