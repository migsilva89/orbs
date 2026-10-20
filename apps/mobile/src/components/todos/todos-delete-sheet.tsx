import { m } from '@openbots/i18n/client';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { match, P } from 'ts-pattern';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { useConnection } from '@/hooks/use-connection';
import type { NavigationRoot } from '@/types/navigation.types';
import type { RpcSession } from '@/types/rpc.types';
import type { TodosDeleteRouteParams } from '@/types/todos.types';

interface TodosDeleteSheetProps {
  route: { params: TodosDeleteRouteParams };
}

export function TodosDeleteSheet({ route }: TodosDeleteSheetProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <TodosDeleteSheetContent params={route.params} session={current} />)
    .otherwise(() => null);
}

interface TodosDeleteSheetContentProps {
  session: RpcSession;
  params: TodosDeleteRouteParams;
}

function TodosDeleteSheetContent({ session, params: { botId, todoId, title } }: TodosDeleteSheetContentProps) {
  const queryClient = useQueryClient();
  const navigation = useNavigation<NavigationRoot>();

  const remove = useMutation(session.rpc.todos.remove.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: session.rpc.todos.key() });
      navigation.goBack();
    },
  }));

  return (
    <ConfirmSheet
      isDestructive
      confirmLabel={m.rooms_todos_delete()}
      error={remove.isError ? m.rooms_todos_action_failed() : null}
      isPending={remove.isPending}
      title={m.rooms_todos_delete_title({ title })}
      onCancel={() => navigation.goBack()}
      onConfirm={() => remove.mutate({ botId, todoId })}
    />
  );
}
