import { BOT, botHandle } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { Bot } from 'lucide-react-native';
import { useFormContext, useWatch } from 'react-hook-form';
import { BotAvatarPicker } from '@/components/bots/bot-avatar-picker';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import type { BotForm } from '@repo/contracts/universal';

interface BotSettingsProfileProps {
  isDisabled: boolean;
}

export function BotSettingsProfile({ isDisabled }: BotSettingsProfileProps) {
  const form = useFormContext<BotForm>();
  const [name, avatar] = useWatch({ control: form.control, name: ['name', 'avatar'] });

  return (
    <BotDetailsSection
      icon={Bot}
      title={m.bots_profile()}
    >
      <Card size="lg">
        <BotAvatarPicker
          isDisabled={isDisabled}
          name={name || m.rooms_bot_default_name()}
          value={avatar ?? null}
          onChange={(next) => form.setValue('avatar', next, { shouldDirty: true })}
        />
        <FormField
          required
          control={form.control}
          editable={!isDisabled}
          label={m.rooms_bot_name()}
          maxLength={64}
          name="name"
          placeholder={m.rooms_bot_default_name()}
          returnKeyType="done"
        />
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          control={form.control}
          editable={!isDisabled}
          label={m.rooms_bot_handle()}
          maxLength={BOT.handleMaxLength}
          name="handle"
          placeholder={botHandle({ name }) || m.rooms_bot_handle_placeholder()}
          returnKeyType="done"
        />
      </Card>
    </BotDetailsSection>
  );
}
