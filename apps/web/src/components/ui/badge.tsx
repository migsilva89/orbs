import { cva } from 'cva';
import { Slot as SlotPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn';
import type { VariantProps } from 'cva';
import type { HTMLAttributes } from 'react';

const badgeVariants = cva({
  base: [
    'inline-flex w-fit items-center justify-center font-medium transition-[color,box-shadow]',
    'border',
    'cursor-pointer overflow-hidden',
    'shrink-0 gap-1 truncate text-xs leading-none [&>svg]:pointer-events-none [&>svg]:size-3',
    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
    'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
  ],
  variants: {
    variant: {
      primary: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
      secondary: 'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
      outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      'outline-secondary': 'border-input bg-muted text-muted-foreground',
      destructive: [
        'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90',
        'focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
      ],
      success: ['border-transparent bg-success-50 text-green-700', 'dark:bg-success-500/10 dark:text-success-400'],
      warning: ['border-transparent bg-warning-50 text-warning-800', 'dark:bg-warning-400/10 dark:text-warning-500'],
      blue: ['border-transparent bg-blue-50 text-blue-700', 'dark:bg-blue-400/10 dark:text-blue-500'],
      purple: ['border-transparent bg-purple-50 text-purple-700', 'dark:bg-purple-400/10 dark:text-purple-500'],
      muted: 'border-transparent text-foreground/80 opacity-60',
      soft: 'border-transparent text-foreground/70 dark:text-foreground/50',
    },
    padding: {
      none: '',
      primary: 'px-2 py-0.5',
      secondary: 'px-2.5 py-0.5',
      relaxed: 'px-2 py-0.5',
    },
    rounded: {
      full: 'rounded-full',
      lg: 'rounded-lg',
    },
    ring: {
      true: '',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'primary',
    padding: 'relaxed',
    rounded: 'full',
    ring: true,
  },
});

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  className?: string
  asChild?: boolean
  as?: string
}

function Badge({ className, variant, asChild, as = 'div', ref, ...props }: BadgeProps & { ref?: React.Ref<HTMLDivElement> }) {
  const Comp = asChild ? SlotPrimitive.Slot : as;
  return <Comp className={cn(badgeVariants({ variant }), className)} data-slot="badge" ref={ref} {...props} />;
}

export { Badge, badgeVariants };
