import { m } from '@repo/i18n/client';
import { BotFormAvatar } from '@repo/ui/bots/bot-form-avatar';
import { BotFormInstructions } from '@repo/ui/bots/bot-form-instructions';
import { BotFormProfile } from '@repo/ui/bots/bot-form-profile';
import { BotFormTools } from '@repo/ui/bots/bot-form-tools';
import { PanelRow } from '@repo/ui/panel';
import { SettingsGroup } from '@repo/ui/settings/settings-group';
import { match } from 'ts-pattern';
import { BotFormModel } from '@/components/bots/bot-form-model';
import type { BotFormSection as BotFormSectionId } from '@repo/contracts/universal';

interface BotFormSectionProps {
  section: BotFormSectionId
  busy: boolean
  onSubmit: () => void
}

export function BotFormSection({ section, busy, onSubmit }: BotFormSectionProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <fieldset className="contents" disabled={busy}>
        {match(section)
          .with('profile', () => (
            <div className="flex flex-col gap-8">
              <BotFormAvatar busy={busy} />
              <SettingsGroup isTitleVisible title={m.bots_identity()}>
                <PanelRow className="block">
                  <BotFormProfile />
                </PanelRow>
              </SettingsGroup>
            </div>
          ))
          .with('instructions', () => <BotFormInstructions busy={busy} />)
          .with('model', () => <BotFormModel isGrouped busy={busy} />)
          .with('tools', () => <BotFormTools busy={busy} />)
          .exhaustive()}
      </fieldset>
    </form>
  );
}
