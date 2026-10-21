import { BOT, botHandle } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { Bot } from 'lucide-react-native';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { BotAvatarPicker } from '@/components/bots/bot-avatar-picker';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { FormField } from '@/components/ui/form-field';
import type { BotForm } from '@openbots/contracts/universal';

interface BotSettingsProfileProps {
  isDisabled: boolean;
}

export function BotSettingsProfile({ isDisabled }: BotSettingsProfileProps) {
  const form = useFormContext<BotForm>();
  const [name, avatar] = useWatch({ control: form.control, name: ['name', 'avatar'] });

  return (
    <BotDetailsSection
      description={m.bots_profile_hint()}
      icon={Bot}
      title={m.bots_profile()}
    >
      <View className="gap-4 rounded-lg border border-border bg-card p-4">
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
      </View>
    </BotDetailsSection>
  );
}
