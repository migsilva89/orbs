import { match, P } from 'ts-pattern';
import { baseLocale, isLocale } from './paraglide/runtime.js';
import type { Locale } from './paraglide/runtime.js';

export { baseLocale as BASE_LOCALE, locales as LOCALES } from './paraglide/runtime.js';
export type { Locale } from './paraglide/runtime.js';

export function resolveLocale(source: string | null | undefined | object): Locale {
  const locale = match(source)
    .with(P.string, (value) => value)
    .with({ locale: P.string }, (value) => value.locale)
    .otherwise(() => baseLocale);

  return isLocale(locale) ? locale : baseLocale;
}
