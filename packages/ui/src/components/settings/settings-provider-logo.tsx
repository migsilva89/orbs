import { botModelBrand } from '@repo/client/client';
import { match } from 'ts-pattern';
import IconCursor from '~icons/logos/cursor-icon';
import IconOpenrouter from '~icons/logos/openrouter-icon-mono';
import IconServer from '~icons/lucide/server';
import { BotBrandLogo } from '../bots/bot-brand-logo';

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
