import { cva } from 'cva';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { View } from 'react-native';
import { match } from 'ts-pattern';
import { useUniwind, withUniwind } from 'uniwind';
import { cn } from '@/lib/cn';
import type { VariantProps } from 'cva';
import type { ViewProps } from 'react-native';

const NativeGlass = withUniwind(GlassView, { style: { fromClassName: 'className' } });
const hasGlass = isGlassEffectAPIAvailable() && isLiquidGlassAvailable();

const glassShapeVariants = cva({
  variants: { shape: { pill: 'rounded-full', field: 'rounded-3xl' } },
  defaultVariants: { shape: 'pill' },
});

const glassVariants = cva({
  composes: glassShapeVariants,
  variants: { native: { false: 'bg-card', true: 'bg-transparent' } },
});

interface GlassSurfaceProps extends ViewProps, VariantProps<typeof glassShapeVariants> {
  interactive?: boolean;
}

export function GlassSurface({ className, shape, interactive = false, children, ...props }: GlassSurfaceProps) {
  const { theme } = useUniwind();
  const classes = cn(glassVariants({ native: hasGlass, shape }), className);
  // Dark glass over a near-black page reads as a hole; a faint white tint lifts it like iOS controls.
  const tint = match(theme).with('dark', () => 'rgba(255,255,255,0.12)').otherwise(() => undefined);

  // UIKit glass ignores border styles, so the rim is its own layer above the glass.
  const content = (
    <>
      {children}
      <View className={cn('absolute inset-0 border border-black/10 dark:border-white/15', glassShapeVariants({ shape }))} pointerEvents="none" style={{ borderCurve: 'continuous' }} />
    </>
  );

  return match(hasGlass)
    .with(true, () => (
      <NativeGlass {...props} className={classes} glassEffectStyle={{ style: 'regular', animate: true }} isInteractive={interactive} style={{ borderCurve: 'continuous' }} tintColor={tint}>
        {content}
      </NativeGlass>
    ))
    .with(false, () => <View {...props} className={classes}>{content}</View>)
    .exhaustive();
}
