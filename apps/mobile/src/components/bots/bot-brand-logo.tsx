import { Box } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';
import { Icon } from '@/components/ui/icon';
import { BRAND_LOGOS } from '@/services/brand/brand.constants';
import type { BotBrand } from '@openbots/client/client';

interface BotBrandLogoProps {
  brand: BotBrand | 'cursor' | 'openrouter' | null;
  size?: number;
}

export function BotBrandLogo({ brand, size = 16 }: BotBrandLogoProps) {
  const [foreground] = useCSSVariable(['--color-foreground']).map(String);

  if (!brand) {
    return (
      <Icon
        icon={Box}
        size="sm"
        tone="muted"
      />
    );
  }

  return (
    <SvgXml
      color={foreground}
      height={size}
      width={size}
      xml={BRAND_LOGOS[brand]}
    />
  );
}
