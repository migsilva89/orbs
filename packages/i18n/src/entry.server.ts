import { AsyncLocalStorage } from 'node:async_hooks';
import { match, P } from 'ts-pattern';
import { overwriteServerAsyncLocalStorage, serverAsyncLocalStorage } from './paraglide/runtime.js';
import type { Locale } from './config';

export { getLocale, isLocale, locales, baseLocale } from './paraglide/runtime.js';
export { resolveLocale } from './config';
export type { Locale } from './config';
export { m } from './paraglide/messages.js';

export function runWithLocale<T>(locale: Locale, run: () => T) {
  const storage = match(serverAsyncLocalStorage)
    .with(P.nullish, () => {
      const store = new AsyncLocalStorage<{ locale?: Locale }>();
      overwriteServerAsyncLocalStorage(store);

      return store;
    })
    .otherwise((store) => store);

  return storage.run({ locale }, run);
}
