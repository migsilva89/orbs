import IconChevronLeft from '~icons/lucide/chevron-left';
import { Button } from '../button';
import type { ReactNode } from 'react';

interface SettingsSubviewProps {
  title: string
  description: string
  backLabel: string
  isBackDisabled?: boolean
  onBack: () => void
  children: ReactNode
}

export function SettingsSubview({ title, description, backLabel, isBackDisabled = false, onBack, children }: SettingsSubviewProps) {
  return (
    <section aria-labelledby="settings-subview-title" className="flex flex-col gap-4">
      <Button
        className="-ml-2 self-start"
        disabled={isBackDisabled}
        size="sm"
        type="button"
        variant="ghost"
        onClick={onBack}
      >
        <IconChevronLeft />
        {backLabel}
      </Button>
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold" id="settings-subview-title">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}
