import { serverOrigin } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import Constants from 'expo-constants';
import { modelName } from 'expo-device';
import { match } from 'ts-pattern';
import type { ServerAddress } from '@repo/contracts/universal';

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

export function connectionDeviceName(): string {
  return modelName ?? m.mobile_device_name_default();
}

export function connectionAddressFromInput(value: string): ServerAddress | null {
  const text = value.trim();
  const origin = serverOrigin.safeParse(/^https?:\/\//iu.test(text) ? text : `http://${text}`);

  return origin.success ? { url: origin.data, kind: 'custom' } : null;
}
