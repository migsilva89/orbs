import { cva } from 'cva';
import { Pressable } from 'react-native';
import { cn } from '@/lib/cn';
import { GlassSurface } from './glass-surface';
import { textContext } from './text';
import type { VariantProps } from 'cva';
import type { ReactNode } from 'react';
import type { PressableProps } from 'react-native';

const glassButtonVariants = cva({
  variants: { size: { icon: 'size-11', pill: 'h-11 px-5' } },
  defaultVariants: { size: 'icon' },
});

const glassButtonContentVariants = cva({
  base: 'flex-1 items-center justify-center',
  variants: { disabled: { true: 'opacity-40' } },
});

interface GlassButtonProps extends Omit<PressableProps, 'children'>, VariantProps<typeof glassButtonVariants> {
  children: ReactNode;
  accessibilityLabel: string;
}

export function GlassButton({ className, size, children, disabled = false, ...props }: GlassButtonProps) {
  return (
    <GlassSurface className={cn(glassButtonVariants({ size }), className)} interactive={!disabled}>
      <Pressable
        {...props}
        accessibilityRole="button"
        accessibilityState={{ ...props.accessibilityState, disabled }}
        className={glassButtonContentVariants({ disabled })}
        disabled={disabled}
      >
        <textContext.Provider value={{ tone: 'default' }}>{children}</textContext.Provider>
      </Pressable>
    </GlassSurface>
  );
}
