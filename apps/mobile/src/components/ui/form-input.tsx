import { useId } from 'react';
import { View } from 'react-native';
import { match, P } from 'ts-pattern';
import { Input } from './input';
import { Label, LabelDescription } from './label';
import type { ComponentProps } from 'react';

interface FormInputProps extends ComponentProps<typeof Input> {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
}

export function FormInput({ label, hint, error, required, editable = true, ...props }: FormInputProps) {
  const id = useId();
  return (
    <View className="min-w-0 gap-2">
      <Label disabled={!editable} invalid={Boolean(error)} nativeID={id} required={required}>{label}</Label>
      <Input {...props} accessibilityLabel={label} accessibilityLabelledBy={id} editable={editable} invalid={Boolean(error)} />
      {match(error)
        .with(P.string, (message) => <LabelDescription accessibilityRole="alert" variant="error">{message}</LabelDescription>)
        .otherwise(() => match(hint)
          .with(P.string, (description) => <LabelDescription>{description}</LabelDescription>)
          .otherwise(() => null))}
    </View>
  );
}
