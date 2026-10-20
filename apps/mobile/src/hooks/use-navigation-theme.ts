import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useCSSVariable, useUniwind } from 'uniwind';
import type { Theme } from '@react-navigation/native';

export function useNavigationTheme(): Theme {
  const { theme } = useUniwind();

  const [background, foreground, card, border, primary] = useCSSVariable([
    '--color-background',
    '--color-foreground',
    '--color-card',
    '--color-border',
    '--color-primary',
  ]);

  const base = theme === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      background: String(background),
      text: String(foreground),
      card: String(card),
      border: String(border),
      primary: String(primary),
    },
  };
}
