import { cva } from 'cva';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn';
import type { VariantProps } from 'cva';
import type { ComponentProps } from 'react';

function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root className={cn('flex flex-col gap-2', className)} data-slot="tabs" {...props} />;
}

const columnsMap = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
} as const;

const tabsListVariants = cva({
  base: 'inline-flex w-fit items-center justify-center text-muted-foreground',
  variants: {
    variant: {
      default: 'h-9 rounded-lg bg-muted p-0.75',
      muted: 'min-h-8 max-w-full gap-0.5',
    },
  },
  defaultVariants: { variant: 'default' },
});

const tabsTriggerVariants = cva({
  base: [
    'inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 sm:min-w-fit sm:flex-none',
    'rounded-md px-2 py-1 text-sm whitespace-nowrap',
    'transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring',
    'disabled:cursor-not-allowed disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    'cursor-pointer',
  ],
  variants: {
    variant: {
      default: [
        'h-[calc(100%-1px)] border border-transparent font-medium text-muted-foreground hover:text-foreground focus-visible:border-ring',
        'data-[state=active]:border-input data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs dark:data-[state=active]:bg-input/30',
      ],
      muted: 'min-h-7 flex-auto whitespace-normal text-muted-foreground hover:text-foreground data-[state=active]:bg-foreground/5 data-[state=active]:text-foreground sm:min-w-0 sm:flex-auto',
    },
  },
  defaultVariants: { variant: 'default' },
});

function TabsList({
  className,
  columns = 2,
  variant,
  ...props
}: ComponentProps<typeof TabsPrimitive.List> & { columns?: 1 | 2 | 3 | 4 } & VariantProps<typeof tabsListVariants>) {
  return <TabsPrimitive.List className={cn(tabsListVariants({ variant }), columnsMap[columns], className)} data-slot="tabs-list" {...props} />;
}

function TabsTrigger({ className, variant, ...props }: ComponentProps<typeof TabsPrimitive.Trigger> & VariantProps<typeof tabsTriggerVariants>) {
  return <TabsPrimitive.Trigger className={cn(tabsTriggerVariants({ variant }), className)} data-slot="tabs-trigger" {...props} />;
}

function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('flex-1 outline-none', className)} data-slot="tabs-content" {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
