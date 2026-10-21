import { APPEARANCE_COLOR_PATTERN } from './appearance.constants';
import type * as AppearanceTypes from '@/types/appearance.types';

export function appearanceColors({ tokens }: AppearanceTypes.AppearanceVariablesParams) {
  return Object.fromEntries(Object.entries(tokens)
    .map(([token, value]) => [token, /^[\d.]+\s+[\d.]+%\s+[\d.]+%$/.test(value) ? `hsl(${value})` : value])
    .filter(([, value]) => APPEARANCE_COLOR_PATTERN.test(value)));
}
