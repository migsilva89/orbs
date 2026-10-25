import { authPairEntry } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { match, P } from 'ts-pattern';
import { connectionCodeFromUrl } from '@/services/connection/connection.utils';
import type { AuthPairEntry } from '@repo/contracts/universal';

export function useConnectionCode() {
  const [code, setCode] = useState('');
  const [target, setTarget] = useState<AuthPairEntry['target']>(null);
  const [linkedPin, setLinkedPin] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    function receiveUrl(url: string | null | undefined) {
      const linked = connectionCodeFromUrl(url ?? null);
      const entry = authPairEntry.safeParse(linked ?? '');

      match({ linked, entry })
        .with({ entry: { success: true } }, ({ entry: { data } }) => {
          setTarget(data.target);
          setCode(data.pin);
          setLinkedPin(data.pin);
        })
        .with({ linked: P.string }, () => setLinkError(m.connect_code_invalid()))
        .otherwise(() => undefined);
    }

    const subscription = Linking.addEventListener('url', ({ url }) => receiveUrl(url));
    void Linking.getInitialURL().then(receiveUrl).catch(() => setLinkError(m.mobile_link_failed()));

    return () => subscription.remove();
  }, []);

  return { code, setCode, linkedPin, target, setTarget, linkError };
}
