import { cva } from 'cva';
import { Children, createContext, Fragment, use } from 'react';
import { Pressable, View } from 'react-native';
import { match } from 'ts-pattern';
import { cn } from '@/lib/cn';
import { cardContext } from './card';
import { Text } from './text';
import type { VariantProps } from 'cva';
import type { ComponentProps, ReactNode } from 'react';
import type { PressableProps, ViewProps } from 'react-native';

const itemVariants = cva({
  base: 'relative w-full flex-row flex-wrap items-center rounded-lg border border-transparent',
  variants: {
    variant: { default: '', outline: 'border-border bg-card', bubble: 'rounded-2xl border-border bg-card' },
    size: { default: 'gap-2.5 px-3 py-2.5', sm: 'min-h-9.5 flex-nowrap gap-2 px-2.5 py-1.5', chat: 'flex-nowrap gap-4 rounded-none border-0 px-5 py-4', row: 'flex-nowrap gap-4 rounded-none border-0 px-5' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

const itemContext = createContext<'default' | 'sm' | 'chat' | 'row'>('default');

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
  const variant = match(use(itemContext)).with('chat', 'row', () => 'conversation-title' as const).otherwise(() => 'item-title' as const);
  return <Text {...props} variant={variant} />;
}

interface ItemDescriptionProps extends ComponentProps<typeof Text> {
  className?: string;
}

export function ItemDescription(props: ItemDescriptionProps) {
  const variant = match(use(itemContext)).with('sm', () => 'small' as const).with('default', () => 'item-description' as const).with('chat', 'row', () => 'conversation-preview' as const).exhaustive();
  return <Text numberOfLines={2} {...props} tone="muted" variant={variant} />;
}

interface ItemButtonProps extends Omit<PressableProps, 'children'>, VariantProps<typeof itemVariants> {
  children: ReactNode;
}

/** A row that acts on press, such as one that opens a choice sheet. */
export function ItemButton({ className, variant, size = 'default', children, ...props }: ItemButtonProps) {
  return (
    <Pressable {...props} accessibilityRole="button" className={cn(itemVariants({ variant, size }), 'active:bg-accent', className)}>
      <itemContext.Provider value={size}>{children}</itemContext.Provider>
    </Pressable>
  );
}

interface ItemGroupProps {
  children: ReactNode;
}

/** An outlined group of rows, separated by hairlines. */
export function ItemGroup({ children }: ItemGroupProps) {
  const items = Children.toArray(children);
  const isInCard = use(cardContext);

  return (
    <View className={cn('overflow-hidden border border-border bg-card', isInCard ? 'rounded-lg' : 'rounded-2xl')}>
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 ? <View className="h-px bg-border" /> : null}
          {item}
        </Fragment>
      ))}
    </View>
  );
}

const itemMediaVariants = cva({
  base: 'items-center justify-center',
  variants: {
    variant: {
      default: 'size-5',
      icon: 'size-8 rounded-sm border border-border bg-muted',
      image: 'size-8 overflow-hidden rounded-sm bg-muted',
    },
  },
  defaultVariants: { variant: 'default' },
});

interface ItemMediaProps extends ViewProps, VariantProps<typeof itemMediaVariants> {
  className?: string;
}

export function ItemMedia({ className, variant, ...props }: ItemMediaProps) {
  return <View {...props} className={cn(itemMediaVariants({ variant }), className)} />;
}

interface ItemValueProps extends ComponentProps<typeof Text> {
  className?: string;
}

export function ItemValue(props: ItemValueProps) {
  return <Text numberOfLines={1} {...props} tone="muted" variant="item-description" />;
}
