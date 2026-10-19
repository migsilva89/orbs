import { cva } from 'cva';
import { cn } from '@/lib/cn';
import type { ComponentProps } from 'react';

const colorSwatchesVariants = cva({ base: 'inline-flex shrink-0 items-center gap-1' });

const colorSwatchVariants = cva({
  base: 'size-3 rounded-full border border-foreground/20',
  variants: {
    variant: {
      outline: 'bg-background',
      default: 'bg-primary',
      secondary: 'bg-secondary',
    },
  },
});

export function ColorSwatches({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span aria-hidden="true" className={cn(colorSwatchesVariants(), className)} {...props}>
      <span className={colorSwatchVariants({ variant: 'outline' })} />
      <span className={colorSwatchVariants({ variant: 'default' })} />
      <span className={colorSwatchVariants({ variant: 'secondary' })} />
    </span>
  );
}
