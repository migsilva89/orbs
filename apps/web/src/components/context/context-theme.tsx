import { ScriptOnce } from '@tanstack/react-router';
import { useSyncExternalStore } from 'react';
import { themeContext } from '@/context/theme';
import { themeCreateService } from '@/services/theme/theme.client';
import { THEME_CONFIG } from '@/services/theme/theme.constants';
import { themeApplySnapshot } from '@/services/theme/theme.utils';
import type { ReactNode } from 'react';

const themeScript = `
(() => {
  const config = ${JSON.stringify(THEME_CONFIG)};
  let choice = 'system';
  let selected = 'openbots';
  let themes = config.presets;
  try {
    const savedMode = localStorage.getItem(config.modeKey);
    if (savedMode === 'light' || savedMode === 'dark') choice = savedMode;
    const saved = JSON.parse(localStorage.getItem(config.palettesKey) || 'null');
    const tokensValid = (tokens) => tokens && typeof tokens === 'object' && !Array.isArray(tokens)
      && Object.entries(tokens).every(([key, value]) => key.startsWith('--') && typeof value === 'string');
    if (saved && typeof saved.selected === 'string' && Array.isArray(saved.custom)
      && saved.custom.every((item) => item && typeof item.id === 'string' && typeof item.name === 'string'
        && tokensValid(item.light) && tokensValid(item.dark))) {
      themes = [...themes, ...saved.custom.filter((item) => !config.presets.some((preset) => preset.id === item.id))];
      if (themes.some((theme) => theme.id === saved.selected)) selected = saved.selected;
    }
  } catch {}
  const system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const snapshot = { choice, selected, themes, resolved: choice === 'system' ? system : choice };
  (${themeApplySnapshot.toString()})(snapshot, config);
})();
`;

export function ContextThemeScript() {
  return <ScriptOnce>{themeScript}</ScriptOnce>;
}

const themeService = themeCreateService();

interface ContextThemeProps {
  children?: ReactNode;
}

export function ContextTheme({ children }: ContextThemeProps) {
  const snapshot = useSyncExternalStore(themeService.subscribe, themeService.getSnapshot, themeService.getServerSnapshot);

  return (
    <themeContext.Provider
      value={{ ...snapshot, setChoice: themeService.setChoice, select: themeService.select, create: themeService.create }}
    >
      {children}
    </themeContext.Provider>
  );
}
