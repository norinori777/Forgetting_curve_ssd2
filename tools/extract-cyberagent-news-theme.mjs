import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const TARGET_URL = 'https://www.cyberagent.co.jp/news';
const OUTPUT_PATH = resolve('tools/generated/cyberagent-news-theme.json');

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function topN(list, n = 12) {
  return [...list]
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
    .map(({ value, count }) => ({ value, count }));
}

function extractPxValues(samples, { min = 1, max = 256 } = {}) {
  const counts = new Map();
  for (const { value, count } of samples) {
    const matches = String(value).match(/-?\d+(?:\.\d+)?px/g) || [];
    for (const token of matches) {
      const num = Number(token.replace('px', ''));
      if (!Number.isFinite(num) || num < min || num > max) continue;
      const normalized = `${Number(num.toFixed(2))}px`;
      counts.set(normalized, (counts.get(normalized) || 0) + count);
    }
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

function pickFirst(samples, fallback) {
  if (!samples.length) return fallback;
  return samples[0].value;
}

function toNamedScale(samples, prefix, maxItems = 8) {
  const picked = samples.slice(0, maxItems);
  const obj = {};
  picked.forEach((item, i) => {
    obj[`${prefix}${i + 1}`] = item.value;
  });
  return obj;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2500);

  const analysis = await page.evaluate(() => {
    const normalizeFont = (fontFamily) =>
      (fontFamily || '')
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .slice(0, 3)
        .join(', ');

    const countByValue = new Map();
    const track = (value) => {
      const v = (value || '').trim();
      if (!v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent' || v === 'normal') {
        return;
      }
      countByValue.set(v, (countByValue.get(v) || 0) + 1);
    };

    const allElements = Array.from(document.querySelectorAll('*'));
    const colorMap = new Map();
    const bgMap = new Map();
    const borderMap = new Map();
    const shadowMap = new Map();
    const radiusMap = new Map();
    const spacingMap = new Map();
    const fontFamilyMap = new Map();
    const fontSizeMap = new Map();
    const lineHeightMap = new Map();
    const weightMap = new Map();

    const updateCount = (map, value) => {
      const v = (value || '').trim();
      if (!v || v === 'normal' || v === 'rgba(0, 0, 0, 0)' || v === 'transparent' || v === 'none') {
        return;
      }
      map.set(v, (map.get(v) || 0) + 1);
    };

    const sampleBySelector = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        selector,
        tag: el.tagName.toLowerCase(),
        color: s.color,
        background: s.backgroundColor,
        fontFamily: normalizeFont(s.fontFamily),
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        borderRadius: s.borderRadius,
        borderColor: s.borderColor,
        boxShadow: s.boxShadow,
        padding: s.padding,
        gap: s.gap,
      };
    };

    for (const el of allElements) {
      const s = getComputedStyle(el);
      updateCount(colorMap, s.color);
      updateCount(bgMap, s.backgroundColor);
      updateCount(borderMap, s.borderColor);
      updateCount(shadowMap, s.boxShadow);
      updateCount(radiusMap, s.borderRadius);
      updateCount(spacingMap, s.padding);
      updateCount(spacingMap, s.margin);
      updateCount(spacingMap, s.gap);
      updateCount(fontFamilyMap, normalizeFont(s.fontFamily));
      updateCount(fontSizeMap, s.fontSize);
      updateCount(lineHeightMap, s.lineHeight);
      updateCount(weightMap, s.fontWeight);
    }

    const mapToArr = (map) =>
      Array.from(map.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);

    const mediaQueries = new Set();
    for (const sheet of Array.from(document.styleSheets)) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSMediaRule && rule.media && rule.media.mediaText) {
          mediaQueries.add(rule.media.mediaText);
        }
      }
    }

    return {
      url: location.href,
      pageTitle: document.title,
      capturedAt: new Date().toISOString(),
      totals: {
        elements: allElements.length,
      },
      selectors: {
        body: sampleBySelector('body'),
        header: sampleBySelector('header'),
        navigationLink: sampleBySelector('header a, nav a, .gnav a'),
        h1: sampleBySelector('h1'),
        h2: sampleBySelector('h2'),
        paragraph: sampleBySelector('p'),
        card: sampleBySelector('article, .card, .news-item, li'),
        button: sampleBySelector('button, .btn, [role="button"]'),
        badge: sampleBySelector('.tag, .badge, .label'),
        footer: sampleBySelector('footer'),
      },
      frequencies: {
        colors: mapToArr(colorMap),
        backgrounds: mapToArr(bgMap),
        borderColors: mapToArr(borderMap),
        shadows: mapToArr(shadowMap),
        radii: mapToArr(radiusMap),
        spacing: mapToArr(spacingMap),
        fontFamilies: mapToArr(fontFamilyMap),
        fontSizes: mapToArr(fontSizeMap),
        lineHeights: mapToArr(lineHeightMap),
        fontWeights: mapToArr(weightMap),
      },
      mediaQueries: Array.from(mediaQueries),
    };
  });

  const theme = {
    meta: {
      source: analysis.url,
      title: analysis.pageTitle,
      capturedAt: analysis.capturedAt,
      tool: 'playwright',
    },
    tokens: {
      color: {
        text: topN(analysis.frequencies.colors, 8),
        background: topN(analysis.frequencies.backgrounds, 8),
        border: topN(analysis.frequencies.borderColors, 8),
      },
      typography: {
        families: topN(analysis.frequencies.fontFamilies, 6),
        sizes: topN(analysis.frequencies.fontSizes, 10),
        lineHeights: topN(analysis.frequencies.lineHeights, 10),
        weights: topN(analysis.frequencies.fontWeights, 8),
      },
      radius: {
        values: topN(analysis.frequencies.radii, 8),
      },
      shadow: {
        values: topN(analysis.frequencies.shadows, 8),
      },
      spacing: {
        values: topN(analysis.frequencies.spacing, 16),
      },
      breakpoints: {
        mediaQueries: uniq(analysis.mediaQueries),
      },
    },
    componentPresets: analysis.selectors,
    rawSummary: {
      elementCount: analysis.totals.elements,
    },
  };

  const cleanTextColors = analysis.frequencies.colors
    .filter((item) => item.value !== 'rgb(255, 255, 255)')
    .slice(0, 6);
  const cleanBgColors = analysis.frequencies.backgrounds.slice(0, 6);
  const cleanBorderColors = analysis.frequencies.borderColors
    .filter((item) => (item.value.match(/rgb\(/g) || []).length <= 1)
    .slice(0, 6);
  const sizeScale = extractPxValues(analysis.frequencies.fontSizes, { min: 10, max: 72 });
  const lineScale = extractPxValues(analysis.frequencies.lineHeights, { min: 12, max: 96 });
  const spacingScale = extractPxValues(analysis.frequencies.spacing, { min: 2, max: 120 });
  const radiusScale = extractPxValues(analysis.frequencies.radii, { min: 1, max: 80 });

  const reusableTheme = {
    meta: {
      source: analysis.url,
      capturedAt: analysis.capturedAt,
      generatedBy: 'playwright-mcp-style-extractor',
      note: 'Values are auto-extracted from computed styles and normalized for reuse.',
    },
    theme: {
      color: {
        text: {
          primary: pickFirst(cleanTextColors, 'rgb(0, 0, 0)'),
          secondary: cleanTextColors[1]?.value || 'rgb(85, 85, 85)',
          inverse: 'rgb(255, 255, 255)',
        },
        surface: {
          base: pickFirst(cleanBgColors, 'rgb(255, 255, 255)'),
          muted: cleanBgColors[5]?.value || 'rgb(240, 240, 238)',
          accent: cleanBgColors[1]?.value || 'rgb(45, 140, 60)',
          dark: cleanBgColors[2]?.value || 'rgb(0, 0, 0)',
        },
        border: {
          default: pickFirst(cleanBorderColors, 'rgb(227, 227, 227)'),
          accent: cleanBorderColors.find((c) => c.value.includes('130, 190, 40'))?.value || 'rgb(130, 190, 40)',
        },
        palette: {
          text: cleanTextColors,
          background: cleanBgColors,
          border: cleanBorderColors,
        },
      },
      typography: {
        family: {
          body: pickFirst(analysis.frequencies.fontFamilies, 'YuGothic, sans-serif'),
          heading: analysis.frequencies.fontFamilies[2]?.value || pickFirst(analysis.frequencies.fontFamilies, 'YuGothic, sans-serif'),
        },
        size: toNamedScale(sizeScale, 's'),
        lineHeight: toNamedScale(lineScale, 'l'),
        weight: {
          regular: '400',
          medium: analysis.frequencies.fontWeights.find((w) => w.value === '500')?.value || '500',
          semibold: analysis.frequencies.fontWeights.find((w) => w.value === '600')?.value || '600',
          bold: analysis.frequencies.fontWeights.find((w) => w.value === '700')?.value || '700',
        },
      },
      spacing: toNamedScale(spacingScale, 'space'),
      radius: {
        scale: toNamedScale(radiusScale, 'r'),
        pill: analysis.frequencies.radii.find((r) => r.value === '50px')?.value || '50px',
        round: analysis.frequencies.radii.find((r) => r.value === '50%')?.value || '50%',
      },
      shadow: {
        soft: analysis.frequencies.shadows[0]?.value || 'none',
        medium: analysis.frequencies.shadows[2]?.value || analysis.frequencies.shadows[0]?.value || 'none',
      },
      breakpoints: {
        mediaQueries: uniq(analysis.mediaQueries),
      },
    },
    componentPresets: analysis.selectors,
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(theme, null, 2)}\n`, 'utf8');
  writeFileSync(
    resolve('tools/generated/cyberagent-news-reusable-theme.json'),
    `${JSON.stringify(reusableTheme, null, 2)}\n`,
    'utf8',
  );

  await browser.close();
  console.log(`Generated theme tokens: ${OUTPUT_PATH}`);
  console.log('Generated reusable theme tokens: tools/generated/cyberagent-news-reusable-theme.json');
})();
