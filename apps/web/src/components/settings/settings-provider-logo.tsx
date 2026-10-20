import { botModelBrand } from '@openbots/client/client';
import { match } from 'ts-pattern';
import { BotBrandLogo } from '@/components/bots/bot-brand-logo';
import IconCursor from '~icons/logos/cursor-icon';
import IconOpenrouter from '~icons/logos/openrouter-icon-mono';
import IconServer from '~icons/lucide/server';

interface SettingsProviderLogoProps {
  providerId: string
}

export function SettingsProviderLogo({ providerId }: SettingsProviderLogoProps) {
  return match(providerId)
    .with('openrouter', () => <IconOpenrouter aria-hidden className="size-4 shrink-0 [&_path]:fill-current" />)
    .with('cursor', () => <IconCursor aria-hidden className="size-4 shrink-0 dark:invert" />)
    .with('cliproxyapi', () => <IconServer aria-hidden className="size-4 shrink-0" />)
    .otherwise(() => <BotBrandLogo brand={botModelBrand({ providerId, modelId: '' })} className="shrink-0" />);
}
