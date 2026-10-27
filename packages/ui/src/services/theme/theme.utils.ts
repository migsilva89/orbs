import { THEME_CONFIG } from '@repo/client/web';
import { themePreferences } from '@repo/contracts/universal';
import type * as ThemeTypes from '@repo/client/web';
import type { ThemePalette } from '@repo/contracts/universal';

function themeReadSnapshot(config: ThemeTypes.ThemeConfig): ThemeTypes.ThemeSnapshot {
  let storedMode: string | null = null;
  let selected = 'default';
  let themes = config.presets;

  try {
    storedMode = localStorage.getItem(config.modeKey);
    const stored = themePreferences.safeParse(JSON.parse(localStorage.getItem(config.palettesKey) ?? 'null'));

    if (stored.success) {
      themes = [...config.presets, ...stored.data.custom.filter((item) => !config.presets.some((preset) => preset.id === item.id))];
      selected = themes.some((theme) => theme.id === stored.data.selected) ? stored.data.selected : 'default';
    }
  } catch {
    selected = 'default';
    themes = config.presets;
  }

  const choice = storedMode === 'light' || storedMode === 'dark' ? storedMode : 'system';
  const system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const resolved = choice === 'system' ? system : choice;

  return { choice, resolved, selected, themes };
}

export function themeApplySnapshot(snapshot: ThemeTypes.ThemeSnapshot, config: ThemeTypes.ThemeConfig) {
  const root = document.documentElement;
  const palette = snapshot.themes.find((theme) => theme.id === snapshot.selected);

  for (const token of config.tokens) {
    root.style.removeProperty(token);
  }

  for (const [token, value] of Object.entries(palette?.[snapshot.resolved] ?? {})) {
    const property = token === '--radius' ? 'border-radius' : 'color';

    if (config.tokens.includes(token) && !value.includes('var(') && CSS.supports(property, value)) {
      root.style.setProperty(token, value);
    }
  }

  root.classList.remove('light', 'dark');
  root.classList.add(snapshot.resolved);
  root.style.colorScheme = snapshot.resolved;

  const pixel = document.createElement('canvas').getContext('2d');
  let themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  if (!themeColor) {
    themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    document.head.appendChild(themeColor);
  }

  if (pixel) {
    pixel.fillStyle = getComputedStyle(root).getPropertyValue('--background').trim();
    pixel.fillRect(0, 0, 1, 1);
    themeColor.content = `#${Array.from(pixel.getImageData(0, 0, 1, 1).data.slice(0, 3), (channel) => channel.toString(16).padStart(2, '0')).join('')}`;
  }
}

export function themeStore(state: ThemeTypes.ThemeState, key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
  } catch {
    return false;
  }

  state.snapshot = undefined;
  themeApply(state);

  return true;
}

export function themeStorePalettes(state: ThemeTypes.ThemeState, selected: string, themes: ThemePalette[]): boolean {
  return themeStore(state, THEME_CONFIG.palettesKey, JSON.stringify({
    selected,
    custom: themes.filter((theme) => !THEME_CONFIG.presets.some((preset) => preset.id === theme.id)),
  }));
}

export function themeSnapshot(state: ThemeTypes.ThemeState): ThemeTypes.ThemeSnapshot {
  state.snapshot ??= themeReadSnapshot(THEME_CONFIG);

  return state.snapshot;
}

export function themeApply(state: ThemeTypes.ThemeState) {
  themeApplySnapshot(themeSnapshot(state), THEME_CONFIG);

  for (const listener of state.listeners) {
    listener();
  }
}

export function themeParseCss({ css }: ThemeTypes.ThemeImportInput): ThemeTypes.ThemeImport {
  const light: ThemeTypes.ThemeTokens = {};
  const dark: ThemeTypes.ThemeTokens = {};
  const stylesheet = new CSSStyleSheet();

  try {
    stylesheet.replaceSync(css);
  } catch {
    return { error: 'values' };
  }

  const themeCollect = (rules: CSSRuleList) => {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        const selectors = rule.selectorText.split(',').map((selector) => selector.trim());
        const targets: ThemeTypes.ThemeTokens[] = [];

        if (selectors.includes(':root')) {
          targets.push(light);
        }

        if (selectors.includes('.dark') || selectors.includes(':root.dark') || selectors.includes('html.dark')) {
          targets.push(dark);
        }

        for (const target of targets) {
          for (const property of rule.style) {
            if (property.startsWith('--')) {
              target[property] = rule.style.getPropertyValue(property).trim();
            }
          }
        }
      } else if (rule instanceof CSSGroupingRule && rule.constructor.name === 'CSSLayerBlockRule') {
        themeCollect(rule.cssRules);
      }
    }
  };

  themeCollect(stylesheet.cssRules);
  if (!THEME_CONFIG.tokens.some((token) => Object.hasOwn(light, token)) || !THEME_CONFIG.tokens.some((token) => Object.hasOwn(dark, token))) {
    return { error: 'modes' };
  }

  const themeNormalize = (declarations: ThemeTypes.ThemeTokens): ThemeTypes.ThemeTokens | undefined => {
    const result: ThemeTypes.ThemeTokens = {};

    const themeResolve = (value: string, seen: Set<string>): string => {
      let resolved = '';
      let cursor = 0;
      let start = value.indexOf('var(');

      while (start !== -1) {
        let depth = 1;
        let end = start + 4;

        for (; end < value.length && depth > 0; end++) {
          if (value[end] === '(') {
            depth++;
          }

          if (value[end] === ')') {
            depth--;
          }
        }

        const argumentsText = value.slice(start + 4, end - 1);
        const comma = argumentsText.indexOf(',');
        const key = (comma === -1 ? argumentsText : argumentsText.slice(0, comma)).trim();
        const fallback = comma === -1 ? '' : argumentsText.slice(comma + 1).trim();

        if (depth !== 0 || !/^--[\w-]+$/.test(key) || seen.has(key)) {
          return '';
        }

        resolved += value.slice(cursor, start);
        resolved += Object.hasOwn(declarations, key)
          ? themeResolve(declarations[key], new Set([...seen, key]))
          : themeResolve(fallback, seen);
        cursor = end;
        start = value.indexOf('var(', cursor);
      }

      return resolved + value.slice(cursor);
    };

    for (const token of THEME_CONFIG.tokens) {
      if (!declarations[token]) {
        continue;
      }

      let value = themeResolve(declarations[token], new Set([token]));
      const property = token === '--radius' ? 'border-radius' : 'color';

      if (property === 'color' && !CSS.supports(property, value) && CSS.supports(property, `hsl(${value})`)) {
        value = `hsl(${value})`;
      }

      if (
        value.includes('var(') ||
        /^(inherit|initial|unset|revert|revert-layer|currentcolor)$/i.test(value) ||
        !CSS.supports(property, value)
      ) {
        return undefined;
      }
      result[token] = value;
    }

    return Object.keys(result).length ? result : undefined;
  };

  const lightTokens = themeNormalize(light);
  const darkTokens = themeNormalize({ ...light, ...dark });

  if (!lightTokens || !darkTokens) {
    return { error: 'values' };
  }

  return { light: lightTokens, dark: darkTokens };
}
