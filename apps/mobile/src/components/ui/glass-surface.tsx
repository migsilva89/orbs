import { cva } from 'cva';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { View } from 'react-native';
import { match } from 'ts-pattern';
import { useUniwind, withUniwind } from 'uniwind';
import { cn } from '@/lib/cn';
import type { ViewProps } from 'react-native';

const NativeGlass = withUniwind(GlassView, { style: { fromClassName: 'className' } });
const hasGlass = isGlassEffectAPIAvailable() && isLiquidGlassAvailable();

const glassVariants = cva({
  base: 'rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-none',
  variants: { native: { false: 'bg-card', true: 'bg-transparent' } },
});

interface GlassSurfaceProps extends ViewProps {
  interactive?: boolean;
}

export function GlassSurface({ className, interactive = false, children, ...props }: GlassSurfaceProps) {
  const { theme } = useUniwind();
  const classes = cn(glassVariants({ native: hasGlass }), className);
  // Dark glass over a near-black page reads as a hole; a faint white tint lifts it like iOS controls.
  const tint = match(theme).with('dark', () => 'rgba(255,255,255,0.12)').otherwise(() => undefined);

  // UIKit glass ignores border styles, so the rim is its own layer above the glass.
  const content = (
    <>
      {children}
      <View className="absolute inset-0 rounded-full border border-black/10 dark:border-white/15" pointerEvents="none" style={{ borderCurve: 'continuous' }} />
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
