import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface OnboardingSceneProps {
  children: ReactNode
}

export function OnboardingScene({ children }: OnboardingSceneProps) {
  return (
    <div aria-hidden="true" className="relative hidden overflow-hidden border-l border-border/60 bg-muted md:block">
      {children}
    </div>
  );
}

interface OnboardingSceneBubbleProps {
  children: ReactNode
  className?: string
}

export function OnboardingSceneBubble({ children, className }: OnboardingSceneBubbleProps) {
  return (
    <p className={cn('m-0 animate-in rounded-2xl border bg-background px-3 py-1.5 text-xs whitespace-nowrap shadow-sm fade-in-0 zoom-in-90', className)}>
      {children}
    </p>
  );
}
