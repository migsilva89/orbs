import { cva } from 'cva';
import { LinearGradient as NativeLinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import { withUniwind } from 'uniwind';
import { cn } from '@/lib/cn';
import type { VariantProps } from 'cva';

const LinearGradient = withUniwind(NativeLinearGradient);

const surfaceVariants = cva({
  base: 'absolute inset-0 overflow-hidden',
  variants: { shape: { default: 'rounded-lg', round: 'rounded-full', inline: 'rounded-sm' } },
  defaultVariants: { shape: 'default' },
});

interface SurfaceProps extends VariantProps<typeof surfaceVariants> {
  className?: string;
}

export function Surface({ shape, className }: SurfaceProps) {
  return (
    <View className={cn(surfaceVariants({ shape }), className)} pointerEvents="none">
      <LinearGradient className="absolute inset-0 opacity-[0.16]" colors={['#ffffff', '#ffffff00']} />
      <View className={cn(surfaceVariants({ shape }), 'border-t border-white/12')} />
    </View>
  );
}
