import { cva } from 'cva';
import { View } from 'react-native';
import { match } from 'ts-pattern';
import { cn } from '@/lib/cn';
import { Text, textContext } from './text';
import type { ComponentProps } from 'react';
import type { ViewProps } from 'react-native';

const cardVariants = cva({ base: 'relative flex-col rounded-md border border-border bg-card' });

const cardHeaderVariants = cva({
  base: 'p-6',
  variants: { variant: { default: 'gap-1.5 pb-2', centered: 'items-center pb-0' } },
  defaultVariants: { variant: 'default' },
});

interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View {...props} className={cn(cardVariants(), className)}>
      <textContext.Provider value={{ tone: 'card' }}>{children}</textContext.Provider>
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
