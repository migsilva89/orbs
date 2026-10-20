import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { GlassSurface } from './glass-surface';
import { TextField } from './text-field';
import type { ReactNode } from 'react';
import type { TextInputProps } from 'react-native';

interface PromptFieldProps extends TextInputProps {
  /** Actions at the end of the field, such as send or stop. */
  actions?: ReactNode;
}

/** The chat composer's growing glass input. */
export function PromptField({ actions, className, ...props }: PromptFieldProps) {
  return (
    <GlassSurface className={cn('min-h-12 flex-row items-center gap-2 py-2 pr-2 pl-4', className)} shape="field">
      <TextField
        multiline
        className="max-h-36 flex-1"
        placeholderTone="glass-muted"
        {...props}
      />
      <View className="flex-row items-center gap-1">{actions}</View>
    </GlassSurface>
  );
}
