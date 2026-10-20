import { cva } from 'cva';
import { View } from 'react-native';
import { match } from 'ts-pattern';
import { cn } from '@/lib/cn';
import { textContext } from './text';
import type { VariantProps } from 'cva';
import type { ViewProps } from 'react-native';

const badgeVariants = cva({
  base: 'items-center justify-center',
  variants: {
    variant: {
      default: 'rounded-md bg-muted px-2 py-0.5',
      outline: 'rounded-md border border-border px-2 py-0.5',
      pinned: 'size-8 rounded-full border-4 border-background bg-orange-500',
    },
  },
  defaultVariants: { variant: 'default' },
});

interface BadgeProps extends ViewProps, VariantProps<typeof badgeVariants> {}

export function Badge({ variant, className, children, ...props }: BadgeProps) {
  const tone = match(variant).with('pinned', () => 'on-destructive' as const).otherwise(() => 'muted' as const);
  return (
    <View {...props} className={cn(badgeVariants({ variant }), className)}>
      <textContext.Provider value={{ tone, variant: 'small' }}>{children}</textContext.Provider>
    </View>
  );
}
