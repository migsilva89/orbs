import { themePreferences } from '@openbots/contracts/universal';
import type * as ThemeTypes from '@/types/theme.types';

export function themeReadSnapshot(config: ThemeTypes.ThemeConfig): ThemeTypes.ThemeSnapshot {
  let storedMode: string | null = null;
  let selected = 'openbots';
  let themes = config.presets;

  try {
    storedMode = localStorage.getItem(config.modeKey);
    const stored = themePreferences.safeParse(JSON.parse(localStorage.getItem(config.palettesKey) ?? 'null'));

    if (stored.success) {
      themes = [...config.presets, ...stored.data.custom.filter((item) => !config.presets.some((preset) => preset.id === item.id))];
      selected = themes.some((theme) => theme.id === stored.data.selected) ? stored.data.selected : 'openbots';
    }
  } catch {
    selected = 'openbots';
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
