import { LazyMotion } from 'motion/react';
import { LayoutPullToRefresh } from '@/components/layout/layout-pull-to-refresh';
import { Toaster } from '@/components/ui/sonner';
import { useTheme } from '@/hooks/use-theme';
import { ContextTheme } from './context-theme';
import type { ReactNode } from 'react';

function ContextToaster() {
  const { resolved } = useTheme();

  return <Toaster theme={resolved} />;
}

interface ContextProvidersProps {
  children?: ReactNode
}

export function ContextProviders({ children }: ContextProvidersProps) {
  return (
    <ContextTheme>
      <LazyMotion
        strict
        features={() => import('@/lib/motion').then((module) => module.motionFeatures)}
      >
        {children}
        <LayoutPullToRefresh />
        <ContextToaster />
      </LazyMotion>
    </ContextTheme>
  );
}
