import { cva } from 'cva';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { EdgeFade } from './edge-fade';
import type { VariantProps } from 'cva';
import type { ViewProps } from 'react-native';

const floatingBarVariants = cva({
  base: 'absolute inset-x-5 flex-row items-center gap-3',
  variants: {
    // Bottom bars sit inside the home-indicator inset, close to the screen edge like iOS 26 toolbars.
    edge: { top: 'top-2 justify-between', bottom: '-bottom-5' },
  },
});

interface FloatingBarProps extends ViewProps, Required<VariantProps<typeof floatingBarVariants>> {}

/** Glass controls floating over scrolling content, with the content fading out behind them. */
export function FloatingBar({ edge, className, ...props }: FloatingBarProps) {
  return (
    <>
      <EdgeFade edge={edge} />
      <View {...props} className={cn(floatingBarVariants({ edge }), className)} />
    </>
  );
}
