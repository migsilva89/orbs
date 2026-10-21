import { expandValidationError } from '@openbots/i18n/validation';
import { useController } from 'react-hook-form';
import { FormInput } from './form-input';
import type { ComponentProps } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

interface FormFieldProps<T extends FieldValues> extends Omit<ComponentProps<typeof FormInput>, 'value' | 'error' | 'onBlur' | 'onChangeText'> {
  control: Control<T>;
  name: FieldPath<T>;
}

/** A `FormInput` bound to a react-hook-form field; a schema error replaces the hint, like the web `FormErrorsAndHint`. */
export function FormField<T extends FieldValues>({ control, name, label, ...props }: FormFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const error = fieldState.error?.message;

  return (
    <FormInput
      {...props}
      error={error ? expandValidationError(error, { field: label }) : null}
      label={label}
      value={field.value}
      onBlur={field.onBlur}
      onChangeText={field.onChange}
    />
  );
}
