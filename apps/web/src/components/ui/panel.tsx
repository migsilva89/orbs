import { Slot as SlotPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn';
import type { ComponentProps } from 'react';

function Panel({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn('@container/panel flex flex-col divide-y divide-border/40 overflow-hidden rounded-lg border bg-card text-card-foreground', className)} data-slot="panel" {...props} />;
}

function PanelHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-center gap-3 px-4 py-3', className)} data-slot="panel-header" {...props} />;
}

function PanelIcon({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground [&_svg]:size-4', className)} data-slot="panel-icon" {...props} />;
}

function PanelRow({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-center gap-4 p-4 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground/70', className)} data-slot="panel-row" {...props} />;
}

function PanelContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)} data-slot="panel-content" {...props} />;
}

function PanelTitle({ className, asChild = false, ...props }: ComponentProps<'h2'> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : 'h2';
  return <Comp className={cn('text-sm font-medium', className)} data-slot="panel-title" {...props} />;
}

function PanelDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-xs text-pretty text-muted-foreground', className)} data-slot="panel-description" {...props} />;
}

function PanelFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-center justify-end gap-2 px-4 py-3', className)} data-slot="panel-footer" {...props} />;
}

export { Panel, PanelContent, PanelDescription, PanelFooter, PanelHeader, PanelIcon, PanelRow, PanelTitle };
