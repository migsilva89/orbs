import { cva } from 'cva';
import { cn } from '../lib/cn';
import type { VariantProps } from 'cva';
import type { ComponentProps } from 'react';

const mentionVariants = cva({
  base: '-my-1 inline-flex max-w-full items-center gap-1 rounded-md px-1 py-px align-[-0.125em] text-sm leading-4 font-medium whitespace-nowrap transition-colors hover:bg-current/10 data-[selected=true]:bg-current/10',
  variants: {
    variant: {
      default: '',
      skill: '[&>svg]:text-skill',
      muted: 'text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

function Mention({ className, variant, ...props }: ComponentProps<'span'> & VariantProps<typeof mentionVariants>) {
  return <span className={cn(mentionVariants({ variant }), className)} data-slot="mention" {...props} />;
}

export { Mention };
