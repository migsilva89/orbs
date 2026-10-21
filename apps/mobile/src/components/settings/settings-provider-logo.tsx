import { botModelBrand } from '@openbots/client/client';
import { Server } from 'lucide-react-native';
import { match } from 'ts-pattern';
import { BotBrandLogo } from '@/components/bots/bot-brand-logo';
import { Icon } from '@/components/ui/icon';

interface SettingsProviderLogoProps {
  providerId: string;
}

export function SettingsProviderLogo({ providerId }: SettingsProviderLogoProps) {
  return match(providerId)
    .with('openrouter', 'cursor', (brand) => <BotBrandLogo brand={brand} />)
    .with('cliproxyapi', () => (
      <Icon
        icon={Server}
        size="sm"
        tone="muted"
      />
    ))
    .otherwise(() => <BotBrandLogo brand={botModelBrand({ providerId, modelId: '' })} />);
}
