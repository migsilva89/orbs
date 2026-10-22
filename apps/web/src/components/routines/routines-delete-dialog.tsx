import { m } from '@repo/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';
import { rpc } from '@/services/rpc/rpc.client';
import type { Bot, Routine } from '@repo/contracts/universal';

interface RoutinesDeleteDialogProps {
  bot: Bot
  routine: Routine
  onOpenChange: (open: boolean) => void
}

export function RoutinesDeleteDialog({ bot, routine, onOpenChange }: RoutinesDeleteDialogProps) {
  const queryClient = useQueryClient();

  const remove = useMutation(rpc.routines.remove.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rpc.routines.key() });
      onOpenChange(false);
    },
  }));

  return (
    <ConfirmationDialog
      confirmLabel={m.rooms_routines_delete()}
      error={remove.isError ? m.rooms_routines_action_failed() : null}
      pending={remove.isPending}
      title={m.rooms_routines_delete_title({ name: routine.name })}
      variant="destructive"
      onConfirm={() => remove.mutate({ botId: bot.id, routineId: routine.id })}
      onOpenChange={onOpenChange}
    >
      {m.rooms_routines_delete_description({ bot: bot.name })}
    </ConfirmationDialog>
  );
}
