import { m } from '@repo/i18n/client';
import { useFormContext, useWatch } from 'react-hook-form';
import { BotAvatarPicker } from './bot-avatar-picker';
import type { BotForm } from '@repo/contracts/universal';

interface BotFormAvatarProps {
  busy: boolean
}

export function BotFormAvatar({ busy }: BotFormAvatarProps) {
  const form = useFormContext<BotForm>();
  const [name, avatar] = useWatch({ control: form.control, name: ['name', 'avatar'] });

  return (
    <BotAvatarPicker
      disabled={busy}
      name={name || m.rooms_bot_default_name()}
      value={avatar ?? null}
      onChange={(next) => form.setValue('avatar', next, { shouldDirty: true })}
    />
  );
}
