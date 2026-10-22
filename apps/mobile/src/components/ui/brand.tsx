import { match } from 'ts-pattern';
import { BRAND_APP_NAME } from '@/services/brand/brand.constants';
import { Text } from './text';

interface BrandProps {
  className?: string;
  size?: 'default' | 'lg';
}

export function Brand({ className, size = 'default' }: BrandProps) {
  const variant = match(size).with('lg', () => 'brand' as const).with('default', () => 'brand-small' as const).exhaustive();
  return <Text className={className} variant={variant}>{BRAND_APP_NAME}</Text>;
}
