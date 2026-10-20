import { cva } from 'cva';
import { LinearGradient as NativeLinearGradient } from 'expo-linear-gradient';
import { match } from 'ts-pattern';
import { useCSSVariable, withUniwind } from 'uniwind';
import { cn } from '@/lib/cn';
import type { VariantProps } from 'cva';

const LinearGradient = withUniwind(NativeLinearGradient);

const edgeFadeVariants = cva({
  base: 'absolute inset-x-0',
  variants: { edge: { top: 'top-0 h-24', bottom: 'bottom-0 h-32' } },
});

interface EdgeFadeProps extends Required<VariantProps<typeof edgeFadeVariants>> {
  className?: string;
}

/** Fades scrolling content into the page background behind floating glass controls. */
export function EdgeFade({ edge, className }: EdgeFadeProps) {
  const background = String(useCSSVariable('--color-background'));

  const colors = match(edge)
    .with('top', () => [background, `${background}00`] as const)
    .with('bottom', () => [`${background}00`, background] as const)
    .exhaustive();

  return <LinearGradient className={cn(edgeFadeVariants({ edge }), className)} colors={colors} pointerEvents="none" />;
}
