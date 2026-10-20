import { cva } from 'cva';
import { createContext, use } from 'react';
import { View } from 'react-native';
import { match, P } from 'ts-pattern';
import { cn } from '@/lib/cn';
import { Text } from './text';
import type { ComponentProps, ReactNode } from 'react';
import type { ViewProps } from 'react-native';

const emptyVariants = cva({
  base: 'min-w-0 flex-1 items-center justify-center gap-6 rounded-lg border-dashed p-6',
  variants: { size: { default: '', sm: '' } },
  defaultVariants: { size: 'default' },
});

const emptyIconVariants = cva({
  base: 'items-center justify-center rounded-xl bg-background shadow-lg ring-1 ring-border dark:bg-muted',
  variants: { size: { default: 'size-14', sm: 'size-10' } },
});

const emptyContext = createContext<'default' | 'sm'>('default');

interface EmptyProps extends ViewProps {
  size?: 'default' | 'sm';
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function Empty({ size = 'default', className, children, icon, title, description, action, ...props }: EmptyProps) {
  return (
    <View {...props} className={cn(emptyVariants({ size }), className)}>
      <emptyContext.Provider value={size}>
        {match(Boolean(icon ?? title ?? description))
          .with(true, () => (
            <EmptyHeader>
              {match(icon).with(P.nonNullable, (content) => <EmptyIcons>{content}</EmptyIcons>).otherwise(() => null)}
              {match(title).with(P.nonNullable, (content) => <EmptyTitle>{content}</EmptyTitle>).otherwise(() => null)}
              {match(description).with(P.nonNullable, (content) => <EmptyDescription>{content}</EmptyDescription>).otherwise(() => null)}
            </EmptyHeader>
          ))
          .with(false, () => null)
          .exhaustive()}
        {children}
        {match(action).with(P.nonNullable, (content) => <EmptyContent>{content}</EmptyContent>).otherwise(() => null)}
      </emptyContext.Provider>
    </View>
  );
}

interface EmptyHeaderProps extends ViewProps {
  className?: string;
}

export function EmptyHeader({ className, ...props }: EmptyHeaderProps) {
  return <View {...props} className={cn('max-w-sm items-center gap-2', className)} />;
}

interface EmptyTitleProps extends ComponentProps<typeof Text> {
  className?: string;
}

export function EmptyTitle({ className, ...props }: EmptyTitleProps) {
  const variant = match(use(emptyContext)).with('sm', () => 'button' as const).with('default', () => 'empty-title' as const).exhaustive();
  return <Text {...props} className={cn('text-center', className)} variant={variant} />;
}

interface EmptyDescriptionProps extends ComponentProps<typeof Text> {
  className?: string;
}

interface EmptyLinkProps extends ComponentProps<typeof Text> {
  className?: string;
}

/** A link inside an empty-state sentence, underlined like the web empty state. */
export function EmptyLink({ className, ...props }: EmptyLinkProps) {
  return <Text accessibilityRole="link" {...props} className={cn('underline', className)} />;
}

export function EmptyDescription({ className, ...props }: EmptyDescriptionProps) {
  return <Text {...props} className={cn('max-w-md text-center', className)} tone="muted" variant="empty-description" />;
}

interface EmptyContentProps extends ViewProps {
  className?: string;
}

export function EmptyContent({ className, ...props }: EmptyContentProps) {
  return <View {...props} className={cn('w-full max-w-sm min-w-0 items-center gap-2', className)} />;
}

interface EmptyIconsProps extends ViewProps {
  className?: string;
}

export function EmptyIcons({ className, ...props }: EmptyIconsProps) {
  const size = use(emptyContext);
  return <View {...props} className={cn(emptyIconVariants({ size }), className)} />;
}
