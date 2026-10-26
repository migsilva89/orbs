import { Text, View } from 'react-native';
import { cn } from '@/lib/cn';
import { GlassSurface } from './glass-surface';
import { TextField } from './text-field';
import type { ReactNode } from 'react';
import type { TextInputProps } from 'react-native';

// Pads one 22pt line to the 32pt action button, so a single line stays centered while longer text grows upward.
const PROMPT_FIELD_LINE_PADDING = 5;

interface PromptFieldProps extends TextInputProps {
  /** An action at the start of the field, such as attach. */
  leading?: ReactNode;
  /** Actions at the end of the field, such as send or stop. */
  actions?: ReactNode;
  /** Content inside the field above the text, such as attachments. */
  header?: ReactNode;
}

/** The chat composer's growing glass input. */
export function PromptField({ leading, actions, header, className, ...props }: PromptFieldProps) {
  return (
    <GlassSurface className={cn('min-h-12 gap-1 py-2 pr-2', leading ? 'pl-2' : 'pl-4', className)} radius="field">
      {header ? <View className="pt-1">{header}</View> : null}
      <View className="flex-row items-end gap-2">
        {leading}
        <TextField
          multiline
          className="max-h-36 flex-1"
          placeholderTone="glass-muted"
          style={{ paddingVertical: PROMPT_FIELD_LINE_PADDING }}
          {...props}
        />
        <View className="flex-row items-center gap-1">{actions}</View>
      </View>
    </GlassSurface>
  );
}

/** A picked mention inside the field's text, tinted like a link. */
export function PromptMention({ children }: { children: string }) {
  return <Text className="text-blue">{children}</Text>;
}
