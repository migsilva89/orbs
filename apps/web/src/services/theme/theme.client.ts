import { themeActionApply } from './theme-action.apply.client';
import { themeActionSubscribe } from './theme-action.subscribe.client';
import { themeQuerySnapshot } from './theme-query.snapshot.client';
import { THEME_CONFIG, THEME_SERVER_SNAPSHOT } from './theme.constants';
import type * as ThemeTypes from '@/types/theme.types';
import type { ThemePalette } from '@openbots/contracts/universal';

export function themeCreateService() {
  const state: ThemeTypes.ThemeState = { listeners: new Set() };

  const themeSave = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      return false;
    }
    state.snapshot = undefined;
    themeActionApply(state);

    return true;
  };

  const themeSavePalette = (selected: string, themes: ThemePalette[]) =>
    themeSave(
      THEME_CONFIG.palettesKey,
      JSON.stringify({
        selected,
        custom: themes.filter((theme) => !THEME_CONFIG.presets.some((preset) => preset.id === theme.id)),
      }),
    );

  return {
    subscribe: (listener: ThemeTypes.ThemeSubscriber) => themeActionSubscribe(state, listener),
    getSnapshot: () => themeQuerySnapshot(state),
    getServerSnapshot: () => THEME_SERVER_SNAPSHOT,
    setChoice: (choice: ThemeTypes.ThemeChoice) => themeSave(THEME_CONFIG.modeKey, choice),
    select: (id: string) => themeSavePalette(id, themeQuerySnapshot(state).themes),
    create: (palette: ThemePalette) => themeSavePalette(palette.id, [...themeQuerySnapshot(state).themes, palette]),
  };
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
