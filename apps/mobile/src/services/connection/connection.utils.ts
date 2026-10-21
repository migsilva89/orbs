import Constants from 'expo-constants';
import { match } from 'ts-pattern';

export function connectionCodeFromUrl(value: string | null): string | null {
  return match(URL.canParse(value ?? ''))
    .with(true, () => {
      const url = new URL(value ?? '');
      const schemes = [Constants.expoConfig?.scheme].flat();
      const isAppLink = schemes.some((scheme) => url.protocol === `${scheme}:`) && url.hostname === 'connect';
      const isWebLink = ['http:', 'https:'].includes(url.protocol) && url.pathname === '/connect';

      return match(isAppLink || isWebLink)
        .with(true, () => new URLSearchParams(url.hash.slice(1)).get('code'))
        .with(false, () => null)
        .exhaustive();
    })
    .with(false, () => null)
    .exhaustive();
}
