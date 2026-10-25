import { cva } from 'cva';
import { OTPInput } from 'input-otp-native';
import { Minus } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { match } from 'ts-pattern';
import { cn } from '@/lib/cn';
import { Icon } from './icon';
import { Text } from './text';
import type { OTPInputProps, SlotProps } from 'input-otp-native';

const inputOtpSlotVariants = cva({
  base: 'size-10 items-center justify-center border-y border-r border-input bg-transparent dark:bg-input/30',
  variants: {
    position: {
      first: 'rounded-l-lg border-l',
      middle: '',
      last: 'rounded-r-lg',
    },
    isActive: { true: 'border-ring ring-[3px] ring-ring/50' },
    invalid: { true: 'border-destructive/80' },
  },
  compoundVariants: [{ isActive: true, invalid: true, class: 'ring-destructive/20 dark:ring-destructive/40' }],
});

interface InputOtpProps extends Omit<OTPInputProps, 'render' | 'value'> {
  invalid?: boolean;
}

interface InputOtpGroupProps {
  slots: SlotProps[];
  invalid: boolean;
}

interface InputOtpSlotProps {
  slot: SlotProps;
  position: 'first' | 'middle' | 'last';
  invalid: boolean;
}

export function InputOtp({ invalid = false, ...props }: InputOtpProps) {
  return (
    <OTPInput
      clearTextOnFocus={false}
      {...props}
      render={({ slots }) => (
        <View className="flex-row items-center gap-2">
          <InputOtpGroup invalid={invalid} slots={slots.slice(0, Math.ceil(slots.length / 2))} />
          <Icon icon={Minus} tone="muted" />
          <InputOtpGroup invalid={invalid} slots={slots.slice(Math.ceil(slots.length / 2))} />
        </View>
      )}
    />
  );
}

function InputOtpGroup({ slots, invalid }: InputOtpGroupProps) {
  return (
    <View className="flex-row">
      {slots.map((slot, index) => (
        <InputOtpSlot
          invalid={invalid}
          key={`slot-${String(index)}`}
          position={inputOtpSlotPosition(index, slots.length)}
          slot={slot}
        />
      ))}
    </View>
  );
}

function inputOtpSlotPosition(index: number, count: number): InputOtpSlotProps['position'] {
  return match(index)
    .with(0, () => 'first' as const)
    .with(count - 1, () => 'last' as const)
    .otherwise(() => 'middle' as const);
}

function InputOtpSlot({ slot, position, invalid }: InputOtpSlotProps) {
  return (
    <Pressable
      className={cn(inputOtpSlotVariants({
        position,
        isActive: slot.isActive,
        invalid,
      }))}
      onPress={slot.focus}
    >
      {slot.char ? <Text variant="pin-slot">{slot.char}</Text> : null}
      {!slot.char && !slot.hasFakeCaret ? <Text className="opacity-40" tone="muted" variant="pin-slot">•</Text> : null}
      {slot.hasFakeCaret ? <InputOtpCaret /> : null}
    </Pressable>
  );
}

function InputOtpCaret() {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    opacity.set(withRepeat(withSequence(withTiming(0, { duration: 500 }), withTiming(1, { duration: 500 })), -1));

    return () => cancelAnimation(opacity);
  }, [opacity, reducedMotion]);

  return <Animated.View className="h-5 w-px bg-foreground" style={style} />;
}
