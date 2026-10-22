import { m } from '@repo/i18n/client';
import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { match, P } from 'ts-pattern';
import { connectionCodeFromUrl } from '@/services/connection/connection.utils';

export function useConnectionCode() {
  const [code, setCode] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    function receiveUrl(url: string | null | undefined) {
      match(connectionCodeFromUrl(url ?? null))
        .with(P.string, setCode)
        .otherwise(() => undefined);
    }

    const subscription = Linking.addEventListener('url', ({ url }) => receiveUrl(url));
    void Linking.getInitialURL().then(receiveUrl).catch(() => setLinkError(m.mobile_link_failed()));

    return () => subscription.remove();
  }, []);

  return { code, setCode, linkError };
}
