import { rpcContext } from '@repo/client/react';
import { useTheme } from '@repo/client/web';
import { ContextTheme } from '@repo/ui/context/context-theme';
import { LayoutPullToRefresh } from '@repo/ui/layout/layout-pull-to-refresh';
import { Toaster } from '@repo/ui/sonner';
import { LazyMotion } from 'motion/react';
import { useEffect } from 'react';
import { RPC_CONTEXT } from '@/services/rpc/rpc.constants';
import type { ReactNode } from 'react';

function ContextToaster() {
  const { resolved } = useTheme();

  useEffect(() => {
    window.__electrobunSendToHost?.({ theme: resolved });
  }, [resolved]);

  return <Toaster theme={resolved} />;
}

interface ContextProvidersProps {
  children?: ReactNode
}

export function ContextProviders({ children }: ContextProvidersProps) {
  return (
    <rpcContext.Provider value={RPC_CONTEXT}>
      <ContextTheme>
        <LazyMotion
          strict
          features={() => import('@repo/ui/motion').then((module) => module.motionFeatures)}
        >
          {children}
          <LayoutPullToRefresh />
          <ContextToaster />
        </LazyMotion>
      </ContextTheme>
    </rpcContext.Provider>
  );
}
