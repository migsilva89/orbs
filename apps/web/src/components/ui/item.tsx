import { cva } from 'cva';
import { Slot as SlotPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn';
import type { VariantProps } from 'cva';
import type { ComponentProps } from 'react';

const itemGroupVariants = cva({
  base: 'group/item-group scrollbar flex flex-col [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1',
  variants: {
    variant: {
      default: '',
      outline: 'rounded-md border border-input p-1 dark:bg-input/30',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const itemVariants = cva({
  base: [
    'group/item relative flex w-full cursor-pointer flex-wrap items-center rounded-lg border border-transparent text-sm transition-colors duration-100 outline-none group-data-[variant=outline]/item-group:rounded-sm hover:bg-accent',
    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
    'has-[[data-slot=item-link]:focus-visible]:border-ring has-[[data-slot=item-link]:focus-visible]:ring-[3px] has-[[data-slot=item-link]:focus-visible]:ring-ring/50',
  ],
  variants: {
    variant: {
      default: '',
      outline: 'border-border bg-card',
    },
    size: {
      default: 'gap-2.5 px-3 py-2.5',
      sm: 'min-h-9.5 flex-nowrap gap-2 px-2.5 py-1.5',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const itemMediaVariants = cva({
  base: 'flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none',
  variants: {
    variant: {
      default: "bg-transparent text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
      icon: "size-8 rounded-sm border bg-muted [&_svg:not([class*='size-'])]:size-4",
      image: 'size-8 overflow-hidden rounded-sm [&_img]:size-full [&_img]:object-cover',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

function ItemGroup({ className, variant, ...props }: ComponentProps<'ul'> & VariantProps<typeof itemGroupVariants>) {
  return <ul className={cn(itemGroupVariants({ variant }), className)} data-slot="item-group" data-variant={variant} {...props} />;
}

function Item({ className, variant, size, ...props }: ComponentProps<'li'> & VariantProps<typeof itemVariants>) {
  return <li className={cn(itemVariants({ variant, size }), className)} data-size={size} data-slot="item" data-variant={variant} {...props} />;
}

function ItemMedia({ className, variant, ...props }: ComponentProps<'div'> & VariantProps<typeof itemMediaVariants>) {
  return <div className={cn(itemMediaVariants({ variant }), className)} data-slot="item-media" data-variant={variant} {...props} />;
}

function ItemContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-1 flex-col gap-0.5 [&+[data-slot=item-content]]:flex-none', className)} data-slot="item-content" {...props} />;
}

function ItemTitle({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex w-fit items-center gap-2 text-sm leading-snug font-medium', className)} data-slot="item-title" {...props} />;
}

function ItemDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'line-clamp-2 text-sm leading-snug font-normal text-muted-foreground group-data-[size=sm]/item:text-xs',
        '[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary',
        className,
      )}
      data-slot="item-description"
      {...props}
    />
  );
}

function ItemActions({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-center gap-1', className)} data-slot="item-actions" {...props} />;
}

/** A read-only value or trailing chevron on the right of a row, muted like a select's value. */
function ItemValue({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      className={cn("flex min-w-0 items-center gap-1 truncate text-sm text-muted-foreground [&_svg]:opacity-50 [&_svg:not([class*='size-'])]:size-4", className)}
      data-slot="item-value"
      {...props}
    />
  );
}

/** The row's link: it stretches over the whole item, so the full row is clickable. */
function ItemLink({ className, asChild = false, ...props }: ComponentProps<'a'> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : 'a';

  return <Comp className={cn('truncate outline-none after:absolute after:inset-0', className)} data-slot="item-link" {...props} />;
}

export { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemLink, ItemMedia, ItemTitle, ItemValue };
