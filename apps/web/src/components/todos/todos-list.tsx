import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ROOMS, ROOMS_DRAG_PRESS } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RoomsPrefillLink } from '@/components/rooms/rooms-prefill-link';
import { TodosItem } from '@/components/todos/todos-item';
import { EmptyCompact } from '@/components/ui/empty';
import { FormErrors } from '@/components/ui/forms/form';
import { ItemGroup } from '@/components/ui/item';
import { Skeleton } from '@/components/ui/skeleton';
import { toasty } from '@/components/ui/sonner';
import { rpc } from '@/services/rpc/rpc.client';
import IconListTodo from '~icons/lucide/list-todo';
import type { DragEndEvent } from '@dnd-kit/core';
import type { Bot } from '@openbots/contracts/universal';

interface TodosListProps {
  bot: Bot
  handle?: string
}

export function TodosList({ bot, handle }: TodosListProps) {
  const queryClient = useQueryClient();
  const options = rpc.todos.list.queryOptions({ input: { botId: bot.id }, refetchInterval: ROOMS.todosRefreshMs });
  const list = useQuery(options);

  const reorder = useMutation(rpc.todos.reorder.mutationOptions({
    onError: () => toasty(m.rooms_todos_action_failed(), '⚠️'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: rpc.todos.key() }),
  }));

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: ROOMS_DRAG_PRESS }),
    useSensor(TouchSensor, { activationConstraint: ROOMS_DRAG_PRESS }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const todos = list.data ?? [];
  const open = todos.filter((todo) => !todo.isDone);
  const done = todos.filter((todo) => todo.isDone);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || over.id === active.id) {
      return;
    }

    const ids = open.map((todo) => todo.id);
    const todoIds = arrayMove(ids, ids.indexOf(Number(active.id)), ids.indexOf(Number(over.id)));
    void queryClient.cancelQueries({ queryKey: options.queryKey });
    queryClient.setQueryData(options.queryKey, [...todoIds.flatMap((id) => open.filter((todo) => todo.id === id)), ...done]);
    reorder.mutate({ botId: bot.id, todoIds });
  };

  return (
    <div className="flex flex-col gap-3">
      <FormErrors error={list.isError ? m.rooms_todos_error() : null} />
      {list.isPending ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((key) => <Skeleton className="h-4 w-2/3" key={key} />)}
        </div>
      ) : null}
      {open.length > 0 ? (
        <DndContext
          modifiers={[restrictToVerticalAxis]}
          sensors={sensors}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={open.map((todo) => todo.id)} strategy={verticalListSortingStrategy}>
            <ItemGroup variant="outline">
              {open.map((todo) => (
                <TodosItem
                  isSortable
                  bot={bot}
                  handle={handle}
                  key={todo.id}
                  todo={todo}
                />
              ))}
            </ItemGroup>
          </SortableContext>
        </DndContext>
      ) : null}
      {done.length > 0 ? (
        <details className="flex flex-col gap-2">
          <summary className="cursor-pointer text-xs text-muted-foreground">{m.rooms_todos_done({ count: done.length })}</summary>
          <ItemGroup className="mt-2" variant="outline">
            {done.map((todo) => (
              <TodosItem
                bot={bot}
                handle={handle}
                key={todo.id}
                todo={todo}
              />
            ))}
          </ItemGroup>
        </details>
      ) : null}
      {list.isSuccess && todos.length === 0 ? (
        <EmptyCompact
          description={(
            <>
              {m.rooms_todos_empty_hint({ bot: bot.name })}
              {' '}
              <RoomsPrefillLink bot={bot} prompt={m.rooms_todos_prompt()}>{m.rooms_prefill_create_inline()}</RoomsPrefillLink>
              {' '}
              {m.rooms_prefill_by_asking({ bot: bot.name })}
            </>
          )}
          icon={<IconListTodo />}
          title={m.rooms_todos_empty_title()}
        />
      ) : null}
      {todos.length > 0 ? (
        <p className="text-xs text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary">
          <RoomsPrefillLink bot={bot} prompt={m.rooms_todos_prompt()}>{m.rooms_prefill_create()}</RoomsPrefillLink>
        </p>
      ) : null}
    </div>
  );
}
