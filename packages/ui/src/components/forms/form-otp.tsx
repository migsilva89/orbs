import { useFormContext } from 'react-hook-form';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '../input-otp';
import { FormErrorsAndHint, FormField, FormItem, FormLabel, useFormField } from './form';
import type { OTPInput } from 'input-otp';
import type { ReactNode } from 'react';
import type * as ReactHookFormTypes from 'react-hook-form';

type FormOTPBaseProps = Omit<React.ComponentProps<typeof OTPInput>, 'name' | 'value' | 'onChange' | 'maxLength' | 'render' | 'children' | 'id'> & {
  label?: ReactNode
  maxLength?: number
  splitEvery?: number
};

type FormOTPProps<
  TFieldValues extends ReactHookFormTypes.FieldValues = ReactHookFormTypes.FieldValues,
  TName extends ReactHookFormTypes.FieldPath<TFieldValues> = ReactHookFormTypes.FieldPath<TFieldValues>,
> = FormOTPBaseProps & {
  name: TName
  control?: ReactHookFormTypes.Control<TFieldValues>
};

type FormOTPInnerProps<TFieldValues extends ReactHookFormTypes.FieldValues, TName extends ReactHookFormTypes.FieldPath<TFieldValues>> = FormOTPBaseProps & {
  field: ReactHookFormTypes.ControllerRenderProps<TFieldValues, TName>
};

function FormOTPInner<TFieldValues extends ReactHookFormTypes.FieldValues, TName extends ReactHookFormTypes.FieldPath<TFieldValues>>({
  field,
  label,
  maxLength = 6,
  splitEvery = maxLength,
  required,
  ...props
}: FormOTPInnerProps<TFieldValues, TName>) {
  const { formItemId, error } = useFormField();
  const indices = Array.from({ length: maxLength }, (_, index) => index);
  const groups = Array.from({ length: Math.ceil(maxLength / splitEvery) }, (_, group) => indices.slice(group * splitEvery, (group + 1) * splitEvery));

  return (
    <>
      {label ? <FormLabel required={required}>{label}</FormLabel> : null}
      <InputOTP
        {...props}
        {...field}
        aria-invalid={Boolean(error)}
        id={formItemId}
        maxLength={maxLength}
      >
        {groups.map((slots, group) => (
          <div className="contents" key={slots[0]}>
            {group > 0 ? <InputOTPSeparator /> : null}
            <InputOTPGroup>
              {slots.map((index) => <InputOTPSlot index={index} key={index} />)}
            </InputOTPGroup>
          </div>
        ))}
      </InputOTP>
      <FormErrorsAndHint />
    </>
  );
}

function FormOTP<
  TFieldValues extends ReactHookFormTypes.FieldValues = ReactHookFormTypes.FieldValues,
  TName extends ReactHookFormTypes.FieldPath<TFieldValues> = ReactHookFormTypes.FieldPath<TFieldValues>,
>({
  name,
  control: controlProp,
  ...rest
}: FormOTPProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>();
  const control = controlProp ?? formContext.control;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormOTPInner {...rest} field={field} />
        </FormItem>
      )}
    />
  );
}

export { FormOTP };
