import { useChatReset } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';
import type { Bot } from '@openbots/contracts/universal';

interface RoomsResetDialogProps {
  bot: Bot
  handoff?: string
  onOpenChange: (open: boolean) => void
}

export function RoomsResetDialog({ bot, handoff, onOpenChange }: RoomsResetDialogProps) {
  const reset = useChatReset({
    botId: bot.id,
    handoff,
    onDone: () => onOpenChange(false),
  });

  return (
    <ConfirmationDialog
      confirmLabel={m.rooms_member_reset()}
      confirmText={bot.name}
      error={reset.problem}
      pending={reset.isPending}
      title={m.rooms_reset_title({ bot: bot.name })}
      variant="destructive"
      onConfirm={reset.reset}
      onOpenChange={onOpenChange}
    >
      {m.rooms_reset_description({ bot: bot.name })}
    </ConfirmationDialog>
  );
}
