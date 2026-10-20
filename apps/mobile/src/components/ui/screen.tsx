import { cva } from 'cva';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { match } from 'ts-pattern';
import { withUniwind } from 'uniwind';
import { cn } from '@/lib/cn';
import type { VariantProps } from 'cva';
import type { ScrollViewProps } from 'react-native';

const SafeAreaView = withUniwind(NativeSafeAreaView);

const screenVariants = cva({
  base: 'flex-1',
  variants: { variant: { default: 'bg-background', muted: 'bg-muted' } },
  defaultVariants: { variant: 'default' },
});

const screenContentVariants = cva({
  base: 'grow gap-6',
  variants: { padding: { default: 'p-6', none: '' }, centered: { true: 'justify-center' } },
  defaultVariants: { padding: 'default' },
});

interface ScreenProps extends ScrollViewProps, VariantProps<typeof screenVariants>, VariantProps<typeof screenContentVariants> {
  scroll?: boolean;
  keyboard?: boolean;
}

export function Screen({ variant, padding, centered, scroll = true, keyboard = false, children, className, contentContainerClassName, ...props }: ScreenProps) {
  const contentClassName = cn(screenContentVariants({ padding, centered }), contentContainerClassName);
  return (
    <SafeAreaView className={cn(screenVariants({ variant }), className)}>
      <KeyboardAvoidingView
        behavior={match(Platform.OS).with('ios', () => 'padding' as const).otherwise(() => undefined)}
        className="flex-1"
        enabled={keyboard}
      >
        {match(scroll)
          .with(true, () => (
            <ScrollView {...props} contentContainerClassName={contentClassName} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          ))
          .with(false, () => <View className={cn('flex-1', contentClassName)}>{children}</View>)
          .exhaustive()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
