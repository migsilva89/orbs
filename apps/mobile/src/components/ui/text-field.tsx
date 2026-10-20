import { cva } from 'cva';
import { use } from 'react';
import { TextInput } from 'react-native';
import { useCSSVariable } from 'uniwind';
import { cn } from '@/lib/cn';
import { textBaseVariants, textContext } from './text';
import type { VariantProps } from 'cva';
import type { TextInputProps } from 'react-native';

const textFieldVariants = cva({
  composes: textBaseVariants,
  variants: { size: { default: 'text-[16px]', lg: 'text-[18px]' } },
  defaultVariants: { size: 'default' },
});

interface TextFieldProps extends TextInputProps, VariantProps<typeof textFieldVariants> {
  placeholderTone?: 'muted-foreground' | 'glass-muted' | 'destructive';
}

export function TextField({ className, size, tone, placeholderTone = 'muted-foreground', style, ...props }: TextFieldProps) {
  const inherited = use(textContext);
  // Resolved directly: Uniwind's placeholder and selection classes do not reach the native input.
  const [placeholderColor, selectionColor] = useCSSVariable([`--color-${placeholderTone}`, '--color-primary']).map(String);
  return (
    <TextInput
      placeholderTextColor={placeholderColor}
      selectionColor={selectionColor}
      {...props}
      className={cn(textFieldVariants({ size, tone: tone ?? inherited.tone }), className)}
      style={[style, { paddingVertical: 0, textAlignVertical: 'center' }]}
    />
  );
}
