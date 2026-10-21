import { cva } from 'cva';
import type { VariantProps } from 'cva';

const statusDotVariants = cva({
  base: 'inline-block size-2 shrink-0 rounded-full',
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
  label: string
}

export function StatusDot({ label, variant }: StatusDotProps) {
  return <span className={statusDotVariants({ variant })} title={label}><span className="sr-only">{label}</span></span>;
}
