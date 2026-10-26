import { cva } from 'cva';
import { Children } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { match, P } from 'ts-pattern';
import { cn } from '@/lib/cn';
import { Surface } from './surface';
import { Text, textContext } from './text';
import type { VariantProps } from 'cva';
import type { ReactNode } from 'react';
import type { PressableProps } from 'react-native';

const buttonVariants = cva({
  base: 'relative flex-row items-center justify-center gap-2 rounded-lg focus:ring-2 focus:ring-ring disabled:opacity-50',
  variants: {
    variant: {
      default: 'bg-primary',
      primary: 'bg-primary shadow-[0_1px_2px_0_rgba(14,18,27,0.24),0_0_0_1px_var(--color-primary)] active:scale-[0.99]',
      secondary: 'bg-secondary active:scale-[0.99]',
      red: 'bg-destructive shadow-[0_1px_2px_0_rgba(14,18,27,0.24),0_0_0_1px_var(--color-destructive)] active:scale-[0.99]',
      destructive: 'bg-destructive',
      outline: 'border border-input bg-background active:scale-[0.99] dark:bg-input/30',
      ghost: 'active:scale-[0.99] active:bg-accent',
      quiet: 'active:scale-[0.99] active:bg-accent',
      floating: 'border border-border bg-background shadow-sm active:bg-accent',
      link: '',
      'link-muted': '',
      'link-destructive': '',
    },
    size: {
      default: 'h-10 px-4',
      xs: 'h-6 gap-1 px-2',
      sm: 'h-9 px-3',
      lg: 'h-11 px-8',
      pill: 'h-9 justify-start rounded-full pr-4 pl-1.5',
      inline: 'h-auto rounded-sm p-0',
      icon: 'size-10 rounded-full',
      'icon-xs': 'size-6 rounded-full',
      'icon-sm': 'size-8 rounded-full',
    },
  },
  compoundVariants: [
    { variant: ['primary', 'red'], size: 'default', class: 'h-9.5' },
    { variant: ['primary', 'red'], size: 'sm', class: 'h-8.5' },
    { variant: ['primary', 'red'], size: 'lg', class: 'h-10.5' },
    { variant: ['primary', 'red'], size: 'icon', class: 'size-9.5' },
  ],
  defaultVariants: { variant: 'primary', size: 'default' },
});

interface ButtonProps extends Omit<PressableProps, 'children'>, VariantProps<typeof buttonVariants> {
  children: ReactNode;
  loading?: boolean;
  loadingIcon?: () => ReactNode;
}

export function Button({ variant = 'primary', size = 'default', className, children, disabled = false, loading = false, loadingIcon, ...props }: ButtonProps) {
  const tone = match(variant)
    .with('default', 'primary', () => 'on-primary' as const)
    .with('secondary', () => 'on-secondary' as const)
    .with('destructive', 'red', () => 'on-destructive' as const)
    .with('quiet', 'link-muted', () => 'muted' as const)
    .with('link', () => 'primary' as const)
    .with('link-destructive', () => 'destructive' as const)
    .otherwise(() => 'default' as const);

  const textVariant = match(size).with('xs', 'icon-xs', () => 'button-small' as const).otherwise(() => 'button' as const);

  const radius = match(size)
    .with('pill', 'icon', 'icon-xs', 'icon-sm', () => 'round' as const)
    .with('inline', () => 'inline' as const)
    .otherwise(() => 'default' as const);

  return (
    <Pressable
      {...props}
      accessibilityRole={props.accessibilityRole ?? 'button'}
      accessibilityState={{ ...props.accessibilityState, disabled: disabled || loading, busy: loading }}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      hitSlop={props.hitSlop ?? 3}
    >
      {match(variant).with('primary', 'red', () => <Surface radius={radius} />).otherwise(() => null)}
      <textContext.Provider value={{ variant: textVariant, tone }}>
        {match(loading)
          .with(true, () => loadingIcon?.() ?? (
            <ActivityIndicator
              colorClassName={match(variant)
                .with('primary', 'default', () => 'accent-primary-foreground')
                .with('destructive', 'red', () => 'accent-destructive-foreground')
                .otherwise(() => 'accent-foreground')}
              size="small"
            />
          ))
          .with(false, () => null)
          .exhaustive()}
        {Children.map(children, (child) => match(child)
          .with(P.string, P.number, (content) => <Text>{content}</Text>)
          .otherwise((content) => content))}
      </textContext.Provider>
    </Pressable>
  );
}
