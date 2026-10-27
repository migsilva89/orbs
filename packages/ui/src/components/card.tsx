import { Slot as SlotPrimitive } from 'radix-ui';
import { cn } from '../lib/cn';
import type { ComponentProps } from 'react';

function Card({ className, asChild, ...props }: ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : 'div';
  return <Comp className={cn('relative flex flex-col rounded-md border bg-card text-card-foreground', className)} data-slot="card" {...props} />;
}

function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-col space-y-1.5 p-6 pb-2 has-data-[slot=card-action]:grid has-data-[slot=card-action]:auto-rows-min has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-action]:gap-2',
        className,
      )}
      data-slot="card-header"
      {...props}
    />
  );
}

function CardTitle({ className, asChild = false, ...props }: ComponentProps<'h3'> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : 'h3';
  return <Comp className={cn('leading-none font-medium', className)} data-slot="card-title" {...props} />;
}

function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-xs font-light text-muted-foreground', className)} data-slot="card-description" {...props} />;
}

function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('p-6 pt-1', className)} data-slot="card-content" {...props} />;
}

function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-center', className)} data-slot="card-footer" {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
