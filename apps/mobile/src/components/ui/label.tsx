import { cva } from 'cva';
import { View } from 'react-native';
import { match } from 'ts-pattern';
import { Text } from './text';
import type { ComponentProps } from 'react';

const labelVariants = cva({
  base: 'flex-row items-center gap-2',
  variants: { disabled: { true: 'opacity-50' } },
});

interface LabelProps extends ComponentProps<typeof Text> {
  required?: boolean;
  showRequired?: boolean;
  disabled?: boolean;
  invalid?: boolean;
}

export function Label({ className, required, showRequired = true, disabled, invalid = false, children, ...props }: LabelProps) {
  return (
    <View className={labelVariants({ disabled })}>
      <Text
        {...props}
        className={className}
        tone={match(invalid).with(true, () => 'destructive' as const).with(false, () => undefined).exhaustive()}
        variant="label"
      >
        {children}
      </Text>
      {match(Boolean(required && showRequired))
        .with(true, () => <Text tone="destructive-subtle" variant="small">*</Text>)
        .with(false, () => null)
        .exhaustive()}
    </View>
  );
}

interface LabelDescriptionProps extends Omit<ComponentProps<typeof Text>, 'variant'> {
  variant?: 'default' | 'error';
}

export function LabelDescription({ className, variant = 'default', ...props }: LabelDescriptionProps) {
  const tone = match(variant).with('error', () => 'destructive' as const).with('default', () => 'muted' as const).exhaustive();
  return <Text {...props} className={className} tone={tone} variant="small" />;
}
