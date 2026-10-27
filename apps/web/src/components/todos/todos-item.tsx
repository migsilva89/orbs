import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { m } from '@repo/i18n/client';
import { Button } from '@repo/ui/button';
import { Checkbox } from '@repo/ui/checkbox';
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from '@repo/ui/item';
import { toasty } from '@repo/ui/sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { rpc } from '@/services/rpc/rpc.client';
import IconGripVertical from '~icons/lucide/grip-vertical';
import IconX from '~icons/lucide/x';
import type { Bot, Todo } from '@repo/contracts/universal';

interface TodosItemProps {
  bot: Bot
  todo: Todo
  handle?: string
  isSortable?: boolean
}

export function TodosItem({ bot, todo, handle, isSortable = false }: TodosItemProps) {
  const queryClient = useQueryClient();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id, disabled: !isSortable });

  const update = useMutation(rpc.todos.update.mutationOptions({
    onError: () => toasty(m.rooms_todos_action_failed(), '⚠️'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: rpc.todos.key() }),
  }));

  const label = m.rooms_todos_remove({ title: todo.title });
  const todoId = String(todo.id);

  return (
    <Item
      className="data-[dragging=true]:opacity-40"
      data-dragging={isDragging}
      ref={setNodeRef}
      size="sm"
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <ItemMedia>
        <Checkbox
          aria-label={todo.isDone ? m.rooms_todos_reopen({ title: todo.title }) : m.rooms_todos_toggle({ title: todo.title })}
          checked={todo.isDone}
          disabled={update.isPending}
          onCheckedChange={(checked) => update.mutate({
            botId: bot.id,
            todoId: todo.id,
            isDone: checked === true,
          })}
        />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full">
          <span className="truncate">{todo.title}</span>
        </ItemTitle>
      </ItemContent>
      <ItemActions>
        {isSortable ? (
          <Button
            aria-label={m.rooms_todos_drag({ title: todo.title })}
            className="cursor-grab touch-none"
            ref={setActivatorNodeRef}
            size="icon-xs"
            title={m.rooms_todos_drag({ title: todo.title })}
            type="button"
            variant="ghost"
            {...attributes}
            {...listeners}
          >
            <IconGripVertical />
          </Button>
        ) : null}
        <Button
          asChild
          aria-label={label}
          size="icon-xs"
          title={label}
          variant="ghost"
        >
          {handle ? (
            <Link
              params={{ handle, todoId }}
              resetScroll={false}
              to="/rooms/direct/$handle/todos/$todoId/delete"
            >
              <IconX />
            </Link>
          ) : (
            <Link
              params={{ botId: bot.id, todoId }}
              resetScroll={false}
              to="/bots/$botId/todos/$todoId/delete"
            >
              <IconX />
            </Link>
          )}
        </Button>
      </ItemActions>
    </Item>
  );
}
