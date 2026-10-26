import { BOT_PERMISSION_LABELS, botModelBrand } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useFormContext, useWatch } from 'react-hook-form';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { BotBrandLogo } from '@/components/bots/bot-brand-logo';
import { OnboardingScene } from '@/components/onboarding/onboarding-scene';
import type { BotForm } from '@repo/contracts/universal';

export function OnboardingSceneBot() {
  const form = useFormContext<BotForm>();
  const [avatar, name, modelProvider, modelId, permission] = useWatch({ control: form.control, name: ['avatar', 'name', 'modelProvider', 'modelId', 'permission'] });
  const bot = { name: name.trim() || m.rooms_bot_default_name(), avatar: avatar ?? undefined };

  return (
    <OnboardingScene screenshot="bot">
      <div className="absolute inset-x-10 bottom-10 flex flex-col overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="flex items-center gap-2.5 border-b px-4 py-3">
          <BotAvatar
            bot={bot}
            cheer={false}
            size={28}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm">{bot.name}</span>
            <span className="flex items-center gap-1 truncate text-xxs text-muted-foreground">
              {modelId ? <BotBrandLogo brand={botModelBrand({ providerId: modelProvider, modelId })} className="size-3" /> : null}
              {modelId || m.rooms_bot_model()}
            </span>
          </div>
          <span className="rounded-full border px-2 py-0.5 text-xxs text-muted-foreground">{BOT_PERMISSION_LABELS[permission]()}</span>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <p className="m-0 self-end rounded-2xl bg-primary px-3 py-1.5 text-xs text-primary-foreground">{m.onboarding_scene_bot_question()}</p>
          <div className="flex items-end gap-2">
            <BotAvatar
              animate
              bot={bot}
              cheer={false}
              size={32}
            />
            <p className="m-0 rounded-2xl bg-muted px-3 py-1.5 text-xs">{m.onboarding_scene_bot_answer({ name: bot.name })}</p>
          </div>
          <div className="flex gap-1 pl-10">
            <span className="size-1.5 animate-typing-dot rounded-full bg-muted-foreground" />
            <span className="size-1.5 animate-typing-dot-2 rounded-full bg-muted-foreground" />
            <span className="size-1.5 animate-typing-dot-3 rounded-full bg-muted-foreground" />
          </div>
        </div>
        <div className="mx-4 mb-4 h-9 rounded-full border" />
      </div>
    </OnboardingScene>
  );
}
