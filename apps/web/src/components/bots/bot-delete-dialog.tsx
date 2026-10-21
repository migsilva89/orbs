import { useBotDelete } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';
import type { Bot } from '@openbots/contracts/universal';

interface BotDeleteDialogProps {
  bot: Bot
  onOpenChange: (open: boolean) => void
  onDeleted: () => Promise<void>
}

export function BotDeleteDialog({ bot, onOpenChange, onDeleted }: BotDeleteDialogProps) {
  const remove = useBotDelete({ botId: bot.id, onDeleted });

  return (
    <ConfirmationDialog
      confirmLabel={m.rooms_bot_delete()}
      confirmText={bot.name}
      error={remove.problem}
      pending={remove.isPending}
      title={m.rooms_bot_delete_title({ bot: bot.name })}
      variant="destructive"
      onConfirm={remove.remove}
      onOpenChange={onOpenChange}
    >
      {m.rooms_bot_delete_description()}
    </ConfirmationDialog>
  );
}
