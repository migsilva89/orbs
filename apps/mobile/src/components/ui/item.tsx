import { cva } from 'cva';
import { createContext, use } from 'react';
import { View } from 'react-native';
import { match } from 'ts-pattern';
import { cn } from '@/lib/cn';
import { Text } from './text';
import type { VariantProps } from 'cva';
import type { ComponentProps } from 'react';
import type { ViewProps } from 'react-native';

const itemVariants = cva({
  base: 'relative w-full flex-row flex-wrap items-center rounded-lg border border-transparent',
  variants: {
    variant: { default: '', outline: 'border-border bg-card' },
    size: { default: 'gap-2.5 px-3 py-2.5', sm: 'min-h-9.5 flex-nowrap gap-2 px-2.5 py-1.5', chat: 'flex-nowrap gap-4 rounded-none border-0 px-5 py-4' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

const itemContext = createContext<'default' | 'sm' | 'chat'>('default');

interface ItemProps extends ViewProps, VariantProps<typeof itemVariants> {}

export function Item({ className, variant, size = 'default', children, ...props }: ItemProps) {
  return (
    <View {...props} className={cn(itemVariants({ variant, size }), className)}>
      <itemContext.Provider value={size}>{children}</itemContext.Provider>
    </View>
  );
}

interface ItemContentProps extends ViewProps {
  className?: string;
}

export function ItemContent({ className, ...props }: ItemContentProps) {
  return <View {...props} className={cn('flex-1 gap-0.5', className)} />;
}

interface ItemTitleProps extends ComponentProps<typeof Text> {
  className?: string;
}

export function ItemTitle(props: ItemTitleProps) {
  const variant = match(use(itemContext)).with('chat', () => 'conversation-title' as const).otherwise(() => 'item-title' as const);
  return <Text {...props} variant={variant} />;
}

interface ItemDescriptionProps extends ComponentProps<typeof Text> {
  className?: string;
}

export function ItemDescription(props: ItemDescriptionProps) {
  const variant = match(use(itemContext)).with('sm', () => 'small' as const).with('default', () => 'item-description' as const).with('chat', () => 'conversation-preview' as const).exhaustive();
  return <Text numberOfLines={2} {...props} tone="muted" variant={variant} />;
}
