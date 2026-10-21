import { cva } from 'cva';
import { match } from 'ts-pattern';
import { cn } from '@/lib/cn';
import { TextField } from './text-field';
import type { ComponentProps } from 'react';

const inputVariants = cva({
  base: 'w-full min-w-0 rounded-md border border-input bg-transparent px-3 shadow-xs focus:border-ring focus:ring-[3px] focus:ring-ring/50 disabled:opacity-50 dark:bg-input/30',
  variants: {
    multiline: { true: 'min-h-40', false: 'h-10' },
    invalid: { true: 'border-destructive/80 focus:border-destructive/80 focus:ring-destructive/20 dark:focus:ring-destructive/40' },
  },
});

/** TextField zeroes vertical padding for one-line fields; a textarea needs it back, with text from the top. */
const TEXTAREA_STYLE = { paddingVertical: 10, textAlignVertical: 'top' } as const;

interface InputProps extends ComponentProps<typeof TextField> {
  invalid?: boolean;
}

export function Input({ className, invalid = false, editable = true, multiline = false, tone, ...props }: InputProps) {
  return (
    <TextField
      {...props}
      className={cn(inputVariants({ invalid, multiline }), className)}
      editable={editable}
      multiline={multiline}
      style={match(multiline).with(true, () => TEXTAREA_STYLE).with(false, () => undefined).exhaustive()}
      placeholderTone={match(invalid).with(true, () => 'destructive' as const).with(false, () => 'muted-foreground' as const).exhaustive()}
      tone={match(invalid).with(true, () => 'destructive' as const).with(false, () => tone).exhaustive()}
    />
  );
}
