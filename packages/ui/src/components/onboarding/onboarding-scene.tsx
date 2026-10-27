import { cn } from '../../lib/cn';
import type { OnboardingStep } from '@repo/contracts/universal';
import type { ReactNode } from 'react';

interface OnboardingSceneProps {
  screenshot: OnboardingStep
  children: ReactNode
}

export function OnboardingScene({ screenshot, children }: OnboardingSceneProps) {
  return (
    <div aria-hidden="true" className="relative hidden overflow-hidden border-l border-border/60 bg-muted md:block">
      <div className="absolute inset-0 bg-dots mask-b-from-40% dark:opacity-35" />
      <div className="absolute top-14 left-10 w-130 overflow-hidden rounded-xl border mask-r-from-75% mask-b-from-60% shadow-floating">
        <img
          alt=""
          className="block w-full dark:hidden"
          src={`/img/onboarding/${screenshot}-light.webp`}
        />
        <img
          alt=""
          className="hidden w-full dark:block"
          src={`/img/onboarding/${screenshot}-dark.webp`}
        />
      </div>
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
