import { cva } from 'cva';
import { cn } from '@/lib/cn';
import type { VariantProps } from 'cva';
import type { ComponentProps } from 'react';

const toolCodeVariants = cva({
  base: 'scrollbar max-h-64 max-w-full overflow-auto font-mono text-xxs leading-relaxed whitespace-pre outline-hidden [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1',
  variants: {
    variant: {
      default: 'text-muted-foreground',
      destructive: 'text-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export function ToolCode({ variant, className, ...props }: ComponentProps<'pre'> & VariantProps<typeof toolCodeVariants>) {
  return <pre className={cn(toolCodeVariants({ variant }), className)} {...props} />;
}

/** Code a tool ran or returned, framed like the other inner blocks of a card. */
export function ToolCodeBlock({ variant, children }: Pick<ComponentProps<typeof ToolCode>, 'variant' | 'children'>) {
  return (
    <div className="rounded-xl border border-input bg-background px-3 py-2">
      <ToolCode variant={variant}>{children}</ToolCode>
    </div>
  );
}
