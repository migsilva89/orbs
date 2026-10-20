import { m } from '@openbots/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';
import { FormErrors } from '@/components/ui/forms/form';
import { rpc } from '@/services/rpc/rpc.client';
import type { Bot, Todo } from '@openbots/contracts/universal';

interface TodosDeleteDialogProps {
  bot: Bot
  todo: Todo
  onOpenChange: (open: boolean) => void
}

export function TodosDeleteDialog({ bot, todo, onOpenChange }: TodosDeleteDialogProps) {
  const queryClient = useQueryClient();

  const remove = useMutation(rpc.todos.remove.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rpc.todos.key() });
      onOpenChange(false);
    },
  }));

  return (
    <ConfirmationDialog
      confirmLabel={m.rooms_todos_delete()}
      pending={remove.isPending}
      title={m.rooms_todos_delete_title({ title: todo.title })}
      variant="destructive"
      onConfirm={() => remove.mutate({ botId: bot.id, todoId: todo.id })}
      onOpenChange={onOpenChange}
    >
      {m.rooms_todos_delete_description({ bot: bot.name })}
      <FormErrors error={remove.isError ? m.rooms_todos_action_failed() : null} />
    </ConfirmationDialog>
  );
}
