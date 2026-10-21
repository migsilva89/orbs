import { cva } from 'cva';
import { Slot as SlotPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn';
import type { VariantProps } from 'cva';
import type { ComponentProps } from 'react';

export const buttonGlossyEffects = [
  // Top highlight
  'before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-[inherit]',
  'before:bg-linear-to-b before:from-white/12 before:to-transparent before:p-px',
  'before:mask-exclude before:[mask-clip:content-box,border-box]',
  'before:mask-[linear-gradient(#fff_0_0),linear-gradient(#fff_0_0)]',
  // Glossy overlay
  'after:absolute after:inset-0 after:rounded-[inherit]',
  'after:bg-linear-to-b after:from-white after:to-transparent',
  'after:pointer-events-none after:opacity-[.16]',
  'after:transition after:duration-200 after:ease-out',
  'hover:after:opacity-[.24]',
];

const buttonVariants = cva({
  base: [
    'relative inline-flex items-center justify-center gap-2',
    'rounded-md whitespace-nowrap',
    'text-sm font-medium',
    'cursor-pointer',
    'transition-all duration-150',
    'outline-none focus-visible:outline-none',
    'focus:ring-0! focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  variants: {
    variant: {
      default: ['bg-primary text-primary-foreground hover:bg-primary/90', 'focus-visible:ring-ring'],
      destructive: ['bg-destructive text-white hover:bg-destructive/90', 'focus-visible:ring-destructive'],
      primary: [
        ...buttonGlossyEffects,
        'text-primary-foreground',
        'bg-primary hover:bg-primary/90',
        'shadow-[0_1px_2px_0_rgba(14,18,27,0.24),0_0_0_1px_var(--color-primary)]',
        'focus:ring-primary focus-visible:ring-primary',
        'active:scale-[0.99] active:transition-none',
      ],
      secondary: [
        'text-secondary-foreground',
        'bg-secondary hover:bg-secondary/90',
        'focus:ring-secondary focus-visible:ring-secondary',
        'active:scale-[0.99] active:transition-none',
      ],
      red: [
        ...buttonGlossyEffects,
        'text-destructive-foreground',
        'bg-destructive hover:bg-destructive/90',
        'shadow-[0_1px_2px_0_rgba(14,18,27,0.24),0_0_0_1px_var(--color-destructive)]',
        'focus:ring-destructive focus-visible:ring-destructive',
        'active:scale-[0.99] active:transition-none',
      ],
      outline: [
        'text-foreground',
        'border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50',
        'focus:ring-input focus-visible:ring-input',
        'active:scale-[0.99] active:transition-none',
      ],
      ghost: [
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:ring-2 focus-visible:ring-primary',
        'active:scale-[0.99] active:transition-none',
      ],
      quiet: [
        'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        'focus-visible:ring-2 focus-visible:ring-primary',
        'active:scale-[0.99] active:transition-none',
      ],
      floating: [
        'border bg-background text-foreground shadow-sm hover:bg-accent',
        'focus-visible:ring-2 focus-visible:ring-ring',
      ],
      link: ['text-primary', 'underline-offset-4 hover:underline', 'focus:ring-0 focus:ring-input focus-visible:ring-2'],
      'link-muted': ['text-muted-foreground', 'underline-offset-4 hover:underline', 'focus:ring-0 focus:ring-input focus-visible:ring-2'],
      'link-destructive': ['text-destructive', 'underline-offset-4 hover:underline', 'focus:ring-0 focus:ring-input focus-visible:ring-2 focus-visible:ring-destructive'],
    },
    size: {
      default: 'h-10 px-4 py-2',
      xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
      sm: 'h-9 px-3',
      lg: 'h-11 px-8',
      pill: 'h-9 justify-start rounded-full pr-4 pl-1.5 text-left',
      inline: 'h-auto rounded-sm p-0 font-[inherit] text-[length:inherit]',
      icon: 'size-10 rounded-full',
      'icon-xs': "size-6 rounded-full [&_svg:not([class*='size-'])]:size-3",
      'icon-sm': 'size-8 rounded-full',
    },
  },
  compoundVariants: [
    { variant: ['primary', 'red'], size: 'default', class: 'h-9.5' },
    { variant: ['primary', 'red'], size: 'sm', class: 'h-8.5' },
    { variant: ['primary', 'red'], size: 'lg', class: 'h-10.5' },
    { variant: ['primary', 'red'], size: 'icon', class: 'size-9.5' },
  ],
  defaultVariants: {
    variant: 'primary',
    size: 'default',
  },
});

function Button({
  variant,
  size,
  className,
  asChild = false,
  type = 'button',
  ref,
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({
        variant,
        size,
      }), className)}
      data-slot="button"
      ref={ref}
      type={type}
      {...props}
    />
  );
}

export { Button, buttonVariants };
