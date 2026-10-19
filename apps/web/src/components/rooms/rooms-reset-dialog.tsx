import { m } from '@openbots/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';
import { toasty } from '@/components/ui/sonner';
import { rpc } from '@/services/rpc/rpc.client';
import type { Bot } from '@openbots/contracts/universal';

interface RoomsResetDialogProps {
  bot: Bot
  onOpenChange: (open: boolean) => void
}

export function RoomsResetDialog({ bot, onOpenChange }: RoomsResetDialogProps) {
  const reset = useMutation(rpc.commands.execute.mutationOptions({
    onSuccess: () => {
      toasty(m.rooms_fresh_done(), '✨');
      onOpenChange(false);
    },
    onError: () => toasty(m.rooms_fresh_failed(), '⏳'),
  }));

  return (
    <ConfirmationDialog
      confirmLabel={m.rooms_member_reset()}
      pending={reset.isPending}
      title={m.rooms_reset_title({ bot: bot.name })}
      onConfirm={() => reset.mutate({ botId: bot.id, name: 'reset' })}
      onOpenChange={onOpenChange}
    >
      {m.rooms_reset_description({ bot: bot.name })}
    </ConfirmationDialog>
  );
}
