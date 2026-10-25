import { OTPInput, OTPInputContext } from 'input-otp';
import { createContext, use } from 'react';
import { cn } from '@/lib/cn';
import Minus from '~icons/lucide/minus';
import type * as React from 'react';

const InputOTPInvalidContext = createContext(false);

function InputOTP({
  className,
  containerClassName,
  'aria-invalid': ariaInvalid,
  ...props
}: React.ComponentProps<typeof OTPInput> & { containerClassName?: string }) {
  return (
    <InputOTPInvalidContext value={ariaInvalid === true || ariaInvalid === 'true'}>
      <OTPInput
        aria-invalid={ariaInvalid}
        className={cn('disabled:cursor-not-allowed', className)}
        containerClassName={cn('flex items-center gap-2 has-disabled:opacity-50', containerClassName)}
        data-slot="input-otp"
        {...props}
      />
    </InputOTPInvalidContext>
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex items-center', className)} data-slot="input-otp-group" {...props} />;
}

function InputOTPSlot({ index, className, ...props }: React.ComponentProps<'div'> & { index: number }) {
  const { char, hasFakeCaret, isActive } = use(OTPInputContext).slots[index] ?? {};
  const isInvalid = use(InputOTPInvalidContext);

  return (
    <div
      aria-invalid={isInvalid}
      className={cn(
        // Base
        'relative flex-center size-10',
        'border-y border-r border-input first:rounded-l-md first:border-l last:rounded-r-md',
        'bg-transparent dark:bg-input/30',
        'text-base md:text-sm',
        'shadow-xs transition-all outline-none',

        // Active
        'data-[active=true]:z-10 data-[active=true]:border-ring',
        'data-[active=true]:ring-[3px] data-[active=true]:ring-ring/50',

        // Invalid
        'aria-invalid:border-destructive',
        'data-[active=true]:aria-invalid:border-destructive',
        'data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40',

        className,
      )}
      data-active={isActive}
      data-slot="input-otp-slot"
      {...props}
    >
      {char ?? (hasFakeCaret ? null : <span className="text-muted-foreground/40">•</span>)}
      {hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000 motion-reduce:animate-none" />
        </div>
      ) : null}
    </div>
  );
}

function InputOTPSeparator(props: React.ComponentProps<'div'>) {
  return (
    <div aria-hidden className="text-muted-foreground" data-slot="input-otp-separator" {...props}>
      <Minus className="size-4" />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
