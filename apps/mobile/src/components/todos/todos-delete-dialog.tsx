import { m } from '@repo/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { match, P } from 'ts-pattern';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useConnection } from '@/hooks/use-connection';
import type { RpcSession } from '@/types/rpc.types';

interface TodosDeleteDialogProps {
  botId: string;
  todoId: number;
  title: string;
}

export function TodosDeleteDialog(params: TodosDeleteDialogProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <TodosDeleteDialogContent params={params} session={current} />)
    .otherwise(() => null);
}

interface TodosDeleteDialogContentProps {
  session: RpcSession;
  params: TodosDeleteDialogProps;
}

function TodosDeleteDialogContent({ session, params: { botId, todoId, title } }: TodosDeleteDialogContentProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const remove = useMutation(session.rpc.todos.remove.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: session.rpc.todos.key() });
      router.back();
    },
  }));

  return (
    <ConfirmDialog
      isDestructive
      confirmLabel={m.rooms_todos_delete()}
      error={remove.isError ? m.rooms_todos_action_failed() : null}
      isPending={remove.isPending}
      title={m.rooms_todos_delete_title({ title })}
      onCancel={() => router.back()}
      onConfirm={() => remove.mutate({ botId, todoId })}
    />
  );
}
