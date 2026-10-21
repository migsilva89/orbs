import { useLocalSearchParams } from 'expo-router';
import { TodosDeleteDialog } from '@/components/todos/todos-delete-dialog';
import type { TodosDeleteRouteParams } from '@/types/todos.types';

export default function TodosDeleteRoute() {
  const { botId, todoId, title } = useLocalSearchParams<TodosDeleteRouteParams>();

  return (
    <TodosDeleteDialog
      botId={botId}
      title={title}
      todoId={Number(todoId)}
    />
  );
}
