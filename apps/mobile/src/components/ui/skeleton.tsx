import { cva } from 'cva';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import type { VariantProps } from 'cva';
import type { ViewProps } from 'react-native';

const skeletonVariants = cva({
  base: 'rounded-md bg-accent',
  variants: { size: { default: 'h-4 w-full', title: 'h-4 w-2/3', description: 'h-4 w-4/5', avatar: 'size-8 rounded-sm', portrait: 'size-12 rounded-full' } },
  defaultVariants: { size: 'default' },
});

interface SkeletonProps extends ViewProps, VariantProps<typeof skeletonVariants> {}

export function Skeleton({ className, size, ...props }: SkeletonProps) {
  return <View accessibilityElementsHidden {...props} className={cn(skeletonVariants({ size }), className)} />;
}
