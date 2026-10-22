import { cva } from 'cva';
import { createContext, use } from 'react';
import { View } from 'react-native';
import { match } from 'ts-pattern';
import { cn } from '@/lib/cn';
import { Text, textContext } from './text';
import type { ComponentProps } from 'react';
import type { ViewProps } from 'react-native';

const alertVariants = cva({
  base: 'relative w-full gap-0.5 rounded-2xl border border-border bg-card px-4 py-3',
  variants: { variant: { default: '', destructive: '' } },
  defaultVariants: { variant: 'default' },
});

const alertContext = createContext<'default' | 'destructive'>('default');

interface AlertProps extends ViewProps {
  variant?: 'default' | 'destructive';
}

export function Alert({ className, variant = 'default', children, ...props }: AlertProps) {
  const tone = match(variant).with('destructive', () => 'destructive' as const).with('default', () => 'card' as const).exhaustive();
  return (
    <View {...props} accessibilityRole="alert" className={cn(alertVariants({ variant }), className)}>
      <alertContext.Provider value={variant}>
        <textContext.Provider value={{ tone }}>{children}</textContext.Provider>
      </alertContext.Provider>
    </View>
  );
}

interface AlertTitleProps extends ComponentProps<typeof Text> {
  className?: string;
}

export function AlertTitle(props: AlertTitleProps) {
  return <Text {...props} variant="button" />;
}

interface AlertDescriptionProps extends ComponentProps<typeof Text> {
  className?: string;
}

export function AlertDescription(props: AlertDescriptionProps) {
  const tone = match(use(alertContext)).with('destructive', () => 'destructive' as const).with('default', () => 'muted' as const).exhaustive();
  return <Text {...props} tone={tone} variant="body" />;
}
