import { cva } from 'cva';
import { use } from 'react';
import { match, P } from 'ts-pattern';
import { useResolveClassNames } from 'uniwind';
import { cn } from '@/lib/cn';
import { textContext, textVariants } from './text';
import type { VariantProps } from 'cva';
import type { LucideIcon, LucideProps } from 'lucide-react-native';

const iconVariants = cva({
  variants: { size: { xs: 'size-2.5', sm: 'size-3', default: 'size-4', action: 'size-6', lg: 'size-7' } },
  defaultVariants: { size: 'default' },
});

interface IconProps extends Omit<LucideProps, 'size' | 'color'>, VariantProps<typeof iconVariants> {
  icon: LucideIcon;
  tone?: VariantProps<typeof textVariants>['tone'];
}

export function Icon({ icon: Component, size, tone, className, ...props }: IconProps) {
  const inherited = use(textContext);
  const style = useResolveClassNames(cn(textVariants({ tone: tone ?? inherited.tone }), iconVariants({ size }), className));
  return <Component {...props} color={style.color} size={match(style.width).with(P.number, P.string, (value) => value).otherwise(() => undefined)} />;
}
