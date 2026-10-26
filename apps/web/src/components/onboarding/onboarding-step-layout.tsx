import { onboardingStep } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { Link, useParams } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import IconArrowLeft from '~icons/lucide/arrow-left';
import type { OnboardingStep } from '@repo/contracts/universal';
import type { ReactNode } from 'react';

interface OnboardingStepLayoutProps {
  title: string
  description: string
  back?: OnboardingStep
  actions: ReactNode
  scene: ReactNode
  children?: ReactNode
}

export function OnboardingStepLayout({ title, description, back, actions, scene, children }: OnboardingStepLayoutProps) {
  const { step } = useParams({ from: '/_chat/onboarding/$step' });
  const steps = onboardingStep.options;
  const current = steps.indexOf(step);

  return (
    <>
      <div className="flex min-h-0 flex-col">
        <div className="scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-8 [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1">
          <div className="flex flex-col gap-2">
            <p className="sr-only">{m.onboarding_progress({ current: current + 1, total: steps.length })}</p>
            <div aria-hidden="true" className="flex gap-1">
              {steps.map((key, index) => (
                <span
                  className={cn('h-1 w-4 rounded-full bg-muted-foreground/20 transition-colors', index <= current && 'bg-foreground')}
                  key={key}
                />
              ))}
            </div>
            <DialogTitle className="mt-2">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
          {children}
        </div>
        <div className="flex items-center gap-2 border-t border-border/50 px-8 py-4">
          {back ? (
            <Button
              asChild
              size="sm"
              variant="ghost"
            >
              <Link params={{ step: back }} to="/onboarding/$step">
                <IconArrowLeft />
                {m.onboarding_back()}
              </Link>
            </Button>
          ) : null}
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </div>
      </div>
      {scene}
    </>
  );
}
