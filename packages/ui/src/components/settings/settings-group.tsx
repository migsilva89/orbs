import { useId } from 'react';
import { cn } from '../../lib/cn';
import { Panel } from '../panel';
import type { ReactNode } from 'react';

interface SettingsGroupProps {
  title: string
  isTitleVisible?: boolean
  children: ReactNode
}

export function SettingsGroup({ title, isTitleVisible = false, children }: SettingsGroupProps) {
  const id = useId();

  return (
    <section aria-labelledby={id} className="flex flex-col">
      <h3 className={cn('pb-2 text-sm text-muted-foreground', !isTitleVisible && 'sr-only')} id={id}>{title}</h3>
      <Panel variant="soft">
        {children}
      </Panel>
    </section>
  );
}
