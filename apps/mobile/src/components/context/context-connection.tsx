import { rpcContext } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useState } from 'react';
import { AppState } from 'react-native';
import { match, P } from 'ts-pattern';
import { connectionContext } from '@/context/connection';
import { useToast } from '@/hooks/use-toast';
import { connectionForget, connectionRead } from '@/services/connection/connection.client';
import { rpcClientCreate } from '@/services/rpc/rpc.client';
import type { ConnectionContextValue } from '@/types/connection-context.types';
import type { ConnectionSaved } from '@openbots/contracts/universal';
import type { ReactNode } from 'react';

interface ContextConnectionProps {
  children: ReactNode;
}

export function ContextConnection({ children }: ContextConnectionProps) {
  const [session, setSession] = useState<ConnectionContextValue['session']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  function connect(connection: ConnectionSaved) {
    setError(null);
    setSession(rpcClientCreate({
      connection,
      notify: ({ message, variant }) => toast.show({ message, variant: variant === 'error' ? 'error' : 'default' }),
      onUnauthorized: () => {
        setSession((current) => (current?.connection === connection ? null : current));
        void connectionForget(connection).then(
          (isForgotten) => isForgotten && setError(m.mobile_connection_revoked()),
          () => setError(m.mobile_storage_failed()),
        );
      },
    }));
  }

  function handleRestored(saved: ConnectionSaved | null) {
    setError(null);
    setIsLoading(false);
    match(saved)
      .with(P.nonNullable, connect)
      .otherwise(() => undefined);
  }

  function handleRestoreFailed() {
    setIsLoading(false);
    setError(m.mobile_storage_failed());
  }

  async function restore() {
    await connectionRead().then(handleRestored, handleRestoreFailed);
  }

  const onRestored = useEffectEvent(handleRestored);
  const onRestoreFailed = useEffectEvent(handleRestoreFailed);
  useEffect(() => {
    void connectionRead().then(onRestored, onRestoreFailed);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
      match(state)
        .with('active', () => session?.resume())
        .otherwise(() => session?.pause());
    });

    return () => {
      subscription.remove();
      session?.pause();
      session?.queryClient.clear();
    };
  }, [session]);

  return (
    <connectionContext.Provider value={{ session, isLoading, error, connect, restore }}>
      {match(session)
        .with(P.nonNullable, (current) => (
          <QueryClientProvider client={current.queryClient}>
            <rpcContext.Provider value={current}>{children}</rpcContext.Provider>
          </QueryClientProvider>
        ))
        .otherwise(() => children)}
    </connectionContext.Provider>
  );
}
