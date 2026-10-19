import { m } from '@openbots/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
    <AlertDialog open onOpenChange={(open) => !remove.isPending && onOpenChange(open)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{m.rooms_bot_delete_title({ bot: bot.name })}</AlertDialogTitle>
          <AlertDialogDescription>{m.rooms_bot_delete_description()}</AlertDialogDescription>
        </AlertDialogHeader>
        {remove.isError ? <p className="text-sm text-destructive" role="alert">{m.rooms_bot_delete_error()}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>{m.ui_cancel()}</AlertDialogCancel>
          <AlertDialogAction
            disabled={remove.isPending}
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              remove.mutate({ botId: bot.id });
            }}
          >
            {m.rooms_bot_delete()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
