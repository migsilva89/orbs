import { cva } from 'cva';
import { createContext } from 'react';
import { View } from 'react-native';
import { match } from 'ts-pattern';
import { cn } from '@/lib/cn';
import { Text, textContext } from './text';
import type { VariantProps } from 'cva';
import type { ComponentProps } from 'react';
import type { ViewProps } from 'react-native';

const cardVariants = cva({
  base: 'relative flex-col rounded-2xl border border-border bg-card',
  variants: { size: { default: '', sm: 'gap-3 p-3', lg: 'gap-4 p-4' } },
  defaultVariants: { size: 'default' },
});

/** True inside a Card, so nested groups use the smaller control radius instead of a second card shape. */
export const cardContext = createContext(false);

const cardHeaderVariants = cva({
  base: 'p-6',
  variants: { variant: { default: 'gap-1.5 pb-2', centered: 'items-center pb-0' } },
  defaultVariants: { variant: 'default' },
});

interface CardProps extends ViewProps, VariantProps<typeof cardVariants> {
  className?: string;
}

export function Card({ size, className, children, ...props }: CardProps) {
  return (
    <View {...props} className={cn(cardVariants({ size }), className)}>
      <cardContext.Provider value>
        <textContext.Provider value={{ tone: 'card' }}>{children}</textContext.Provider>
      </cardContext.Provider>
    </View>
  );
}

interface CardHeaderProps extends ViewProps {
  variant?: 'default' | 'centered';
}

export function CardHeader({ className, variant, ...props }: CardHeaderProps) {
  return <View {...props} className={cn(cardHeaderVariants({ variant }), className)} />;
}

interface CardTitleProps extends Omit<ComponentProps<typeof Text>, 'size'> {
  size?: 'default' | 'lg';
}

export function CardTitle({ size = 'default', ...props }: CardTitleProps) {
  const variant = match(size).with('lg', () => 'heading' as const).with('default', () => 'card-title' as const).exhaustive();
  return <Text {...props} variant={variant} />;
}

interface CardDescriptionProps extends Omit<ComponentProps<typeof Text>, 'variant'> {
  variant?: 'default' | 'plain';
}

export function CardDescription({ variant = 'default', ...props }: CardDescriptionProps) {
  const textVariant = match(variant).with('plain', () => 'small' as const).with('default', () => 'card-description' as const).exhaustive();
  return <Text {...props} tone="muted" variant={textVariant} />;
}

interface CardContentProps extends ViewProps {
  className?: string;
}

export function CardContent({ className, ...props }: CardContentProps) {
  return <View {...props} className={cn('p-6 pt-1', className)} />;
}

interface CardFooterProps extends ViewProps {
  className?: string;
}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return <View {...props} className={cn('flex-row items-center', className)} />;
}
