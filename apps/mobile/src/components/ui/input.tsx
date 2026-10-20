import { cva } from 'cva';
import { match } from 'ts-pattern';
import { cn } from '@/lib/cn';
import { TextField } from './text-field';
import type { ComponentProps } from 'react';

const inputVariants = cva({
  base: 'h-10 w-full min-w-0 rounded-md border border-input bg-transparent px-3 shadow-xs focus:border-ring focus:ring-[3px] focus:ring-ring/50 disabled:opacity-50 dark:bg-input/30',
  variants: {
    invalid: { true: 'border-destructive/80 focus:border-destructive/80 focus:ring-destructive/20 dark:focus:ring-destructive/40' },
  },
});

interface InputProps extends ComponentProps<typeof TextField> {
  invalid?: boolean;
}

export function Input({ className, invalid = false, editable = true, tone, ...props }: InputProps) {
  return (
    <TextField
      {...props}
      className={cn(inputVariants({ invalid }), className)}
      editable={editable}
      placeholderTone={match(invalid).with(true, () => 'destructive' as const).with(false, () => 'muted-foreground' as const).exhaustive()}
      tone={match(invalid).with(true, () => 'destructive' as const).with(false, () => tone).exhaustive()}
    />
  );
}
