import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { botForm } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { BotFormAvatar } from '@/components/bots/bot-form-avatar';
import { BotFormModel } from '@/components/bots/bot-form-model';
import { BotFormProfile } from '@/components/bots/bot-form-profile';
import { ButtonLoading } from '@/components/ui/button-loading';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormErrors } from '@/components/ui/forms/form';
import { botHandle } from '@/services/bot/bot.client';
import { rpc } from '@/services/rpc/rpc.client';
import type { BotSettings } from '@/types/bot.types';
import type { Bot } from '@openbots/contracts/universal';

interface BotCreateDialogProps {
  settings: BotSettings | null
  onOpenChange: (open: boolean) => void
  onCreated: (bot: Bot) => void
}

export function BotCreateDialog({ settings, onOpenChange, onCreated }: BotCreateDialogProps) {
  const queryClient = useQueryClient();

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

  const create = useMutation(rpc.bots.create.mutationOptions({
    onSuccess: async (bot) => {
      await queryClient.invalidateQueries({ queryKey: rpc.bots.list.key() });
      onCreated(bot);
    },
  }));

  return (
    <Dialog open onOpenChange={(open) => !create.isPending && onOpenChange(open)}>
      <DialogContent className="max-h-[85svh] grid-cols-1 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{m.rooms_bot_title()}</DialogTitle>
          <DialogDescription>{m.rooms_bot_description()}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit((input) => create.mutate({ ...input, handle: input.handle === '' ? botHandle({ name: input.name }) : input.handle }))}>
            <fieldset className="contents" disabled={create.isPending}>
              <BotFormAvatar busy={create.isPending} />
              <BotFormProfile />
              <BotFormModel busy={create.isPending} />
              <FormErrors error={create.isError ? m.rooms_bot_create_error() : null} />
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
