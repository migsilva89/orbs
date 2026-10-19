import { cva } from 'cva';
import { cn } from '@/lib/cn';
import type { VariantProps } from 'cva';
import type { ComponentProps } from 'react';

const itemGroupVariants = cva({
  base: 'group/item-group flex flex-col',
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
  base: 'group/item flex w-full cursor-pointer flex-wrap items-center rounded-lg border border-transparent text-sm transition-colors duration-100 outline-none group-data-[variant=outline]/item-group:rounded-sm hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
  variants: {
    variant: {
      default: '',
      outline: 'border-border bg-card',
    },
    size: {
      default: 'gap-2.5 px-3 py-2.5',
      sm: 'gap-2 px-2.5 py-1.5',
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
      default: 'bg-transparent',
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
  return <div className={cn('flex w-fit items-center gap-2 text-sm leading-snug', className)} data-slot="item-title" {...props} />;
}

function ItemDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'line-clamp-2 text-sm leading-snug font-normal text-muted-foreground group-data-[size=sm]/item:text-xs group-data-[size=sm]/item:text-muted-foreground/80',
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

export { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle };
