import { cva } from 'cva';
import { useId } from 'react';
import { cn } from '@/lib/cn';
import type { VariantProps } from 'cva';
import type * as React from 'react';

const textareaVariants = cva({
  base: 'flex field-sizing-content min-h-16 w-full border border-input text-base transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:ring-destructive/40',
  variants: {
    variant: {
      default: 'rounded-md bg-transparent px-3 py-2 shadow-xs dark:bg-input/30',
      // The chat's answer fields: the composer's fill at a card's inner radius.
      field: 'rounded-xl bg-background px-4 py-3 shadow-sm dark:bg-card',
    },
  },
  defaultVariants: { variant: 'default' },
});

function Textarea({ variant, className, id, ...props }: React.ComponentProps<'textarea'> & VariantProps<typeof textareaVariants>) {
  const autoId = useId();

  return (
    <textarea
      className={cn(textareaVariants({ variant }), className)}
      data-slot="textarea"
      id={id ?? autoId}
      {...props}
    />
  );
}

export { Textarea };
