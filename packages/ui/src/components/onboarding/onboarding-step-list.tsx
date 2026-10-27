import type { ComponentType } from 'react';

interface OnboardingStepListProps {
  items: { icon: ComponentType<{ className?: string }>, label: string }[]
}

export function OnboardingStepList({ items }: OnboardingStepListProps) {
  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map(({ icon: Icon, label }) => (
        <li className="flex items-center gap-3 text-sm" key={label}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}
