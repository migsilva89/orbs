import { m } from '@openbots/i18n/client';
import { match } from 'ts-pattern';
import { Text } from './text';

interface BrandProps {
  className?: string;
  size?: 'default' | 'lg';
}

export function Brand({ className, size = 'default' }: BrandProps) {
  const variant = match(size).with('lg', () => 'brand' as const).with('default', () => 'brand-small' as const).exhaustive();
  return <Text className={className} variant={variant}>{m.layout_brand()}</Text>;
}
