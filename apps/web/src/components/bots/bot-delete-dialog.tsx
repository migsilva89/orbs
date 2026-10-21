import { m } from '@openbots/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';
import { rpc } from '@/services/rpc/rpc.client';
import type { Bot } from '@openbots/contracts/universal';

interface BotDeleteDialogProps {
  bot: Bot
  onOpenChange: (open: boolean) => void
  onDeleted: () => Promise<void>
}

export function BotDeleteDialog({ bot, onOpenChange, onDeleted }: BotDeleteDialogProps) {
  const queryClient = useQueryClient();

  const remove = useMutation(rpc.bots.delete.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rpc.bots.list.key() });

      for (const queryKey of [rpc.bots.get.key({ input: { botId: bot.id } }), rpc.routines.key(), rpc.artifacts.key()]) {
        queryClient.removeQueries({ queryKey });
      }

      await onDeleted();
    },
  }));

  return (
    <ConfirmationDialog
      confirmLabel={m.rooms_bot_delete()}
      confirmText={bot.name}
      error={remove.isError ? m.rooms_bot_delete_error() : null}
      pending={remove.isPending}
      title={m.rooms_bot_delete_title({ bot: bot.name })}
      variant="destructive"
      onConfirm={() => remove.mutate({ botId: bot.id })}
      onOpenChange={onOpenChange}
    >
      {m.rooms_bot_delete_description()}
    </ConfirmationDialog>
  );
}
