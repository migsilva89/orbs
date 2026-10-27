import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useBotCreate } from '@repo/client/react';
import { botForm } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { BotFormAvatar } from '@repo/ui/bots/bot-form-avatar';
import { BotFormProfile } from '@repo/ui/bots/bot-form-profile';
import { ButtonLoading } from '@repo/ui/button-loading';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog';
import { Form, FormErrors } from '@repo/ui/forms/form';
import { useForm } from 'react-hook-form';
import { BotFormModel } from '@/components/bots/bot-form-model';
import type { BotSettings } from '@repo/client/client';
import type { Bot } from '@repo/contracts/universal';

interface BotCreateDialogProps {
  settings: BotSettings | null
  onOpenChange: (open: boolean) => void
  onCreated: (bot: Bot) => void
}

export function BotCreateDialog({ settings, onOpenChange, onCreated }: BotCreateDialogProps) {
  const form = useForm({
    resolver: standardSchemaResolver(botForm),
    defaultValues: {
      avatar: null,
      fallbackModel: null,
      name: m.rooms_bot_default_name(),
      handle: '',
      instructions: '',
      modelProvider: settings?.modelProvider ?? '',
      modelId: settings?.modelId ?? '',
      thinkingLevel: settings?.thinkingLevel ?? 'medium',
    },
  });

  const create = useBotCreate({ onCreated });

  return (
    <Dialog open onOpenChange={(open) => !create.isPending && onOpenChange(open)}>
      <DialogContent className="max-h-[85svh] grid-cols-1 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{m.rooms_bot_title()}</DialogTitle>
          <DialogDescription>{m.rooms_bot_description()}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(create.create)}>
            <fieldset className="contents" disabled={create.isPending}>
              <BotFormAvatar busy={create.isPending} />
              <BotFormProfile />
              <BotFormModel busy={create.isPending} />
              <FormErrors error={create.problem} />
              <DialogFooter>
                <ButtonLoading
                  disabled={create.isPending}
                  loading={create.isPending}
                  type="submit"
                >
                  {m.rooms_bot_submit()}
                </ButtonLoading>
              </DialogFooter>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
