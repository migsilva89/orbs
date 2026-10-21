import { useState } from 'react';
import { ScopedVariables, useUniwind } from 'uniwind';
import { appearanceContext } from '@/context/appearance';
import { appearancePalettesRead, appearancePalettesSave, appearanceVariables } from '@/services/appearance/appearance.client';
import type { AppearancePalettes } from '@/types/appearance.types';
import type { ReactNode } from 'react';

interface ContextAppearanceProps {
  children: ReactNode;
}

export function ContextAppearance({ children }: ContextAppearanceProps) {
  const { theme } = useUniwind();
  const [palettes, setPalettes] = useState(appearancePalettesRead);
  const palette = palettes.themes.find((item) => item.id === palettes.selected);
  const mode = theme === 'dark' ? 'dark' : 'light';

  const save = (next: AppearancePalettes) => {
    try {
      appearancePalettesSave(next);
    } catch {
      return false;
    }

    setPalettes(next);

    return true;
  };

  return (
    <appearanceContext.Provider
      value={{
        ...palettes,
        select: (id) => save({ ...palettes, selected: id }),
        create: (created) => save({ selected: created.id, themes: [...palettes.themes, created] }),
      }}
    >
      <ScopedVariables variables={appearanceVariables({ tokens: palette?.[mode] ?? {} })}>{children}</ScopedVariables>
    </appearanceContext.Provider>
  );
}
