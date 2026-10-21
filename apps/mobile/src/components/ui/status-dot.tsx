import { cva } from 'cva';
import { View } from 'react-native';
import type { VariantProps } from 'cva';

const statusDotVariants = cva({
  base: 'size-2 shrink-0 rounded-full',
  variants: {
    variant: {
      default: 'bg-muted-foreground',
      success: 'bg-success',
      warning: 'bg-warning',
      destructive: 'bg-destructive',
    },
  },
  defaultVariants: { variant: 'default' },
});

interface StatusDotProps extends VariantProps<typeof statusDotVariants> {
  label: string;
}

export function StatusDot({ label, variant }: StatusDotProps) {
  return <View accessibilityLabel={label} className={statusDotVariants({ variant })} />;
}
