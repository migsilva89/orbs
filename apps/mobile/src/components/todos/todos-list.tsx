import { m } from '@openbots/i18n/client';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Circle, CircleCheck, ListTodo, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Empty, EmptyLink } from '@/components/ui/empty';
import { Icon } from '@/components/ui/icon';
import { Item, ItemContent, ItemTitle } from '@/components/ui/item';
import { SectionHeading } from '@/components/ui/section-heading';
import { Text } from '@/components/ui/text';
import { useToast } from '@/hooks/use-toast';
import type { BotDetailsSectionProps } from '@/types/bot-details.types';
import type { NavigationRoot } from '@/types/navigation.types';
import type { RpcSession } from '@/types/rpc.types';
import type { Todo } from '@openbots/contracts/universal';

interface TodosListProps extends BotDetailsSectionProps {
  session: RpcSession;
}

export function TodosList({ session, bot, onPrefill }: TodosListProps) {
  const queryClient = useQueryClient();
  const navigation = useNavigation<NavigationRoot>();
  const toast = useToast();
  const [isDoneShown, setIsDoneShown] = useState(false);
  const list = useQuery(session.rpc.todos.list.queryOptions({ input: { botId: bot.id } }));

  const update = useMutation(session.rpc.todos.update.mutationOptions({
    onError: () => toast.show({ message: m.rooms_todos_action_failed() }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: session.rpc.todos.key() }),
  }));

  const todos = list.data ?? [];
  const open = todos.filter((todo) => !todo.isDone);
  const done = todos.filter((todo) => todo.isDone);

  const toggle = (todo: Todo) => update.mutate({
    botId: bot.id,
    todoId: todo.id,
    isDone: !todo.isDone,
  });

  const remove = (todo: Todo) => navigation.navigate('TodosDelete', {
    botId: bot.id,
    todoId: todo.id,
    title: todo.title,
  });

  return (
    <View className="gap-2">
      {list.isError ? <Text tone="destructive" variant="small">{m.rooms_todos_error()}</Text> : null}
      {list.isSuccess && todos.length === 0 ? (
        <Empty
          description={(
            <>
              {`${m.rooms_todos_empty_hint({ bot: bot.name })} `}
              <EmptyLink onPress={() => onPrefill(m.rooms_todos_prompt())}>{m.rooms_prefill_create_inline()}</EmptyLink>
              {` ${m.rooms_prefill_by_asking({ bot: bot.name })}`}
            </>
          )}
          icon={(
            <Icon
              icon={ListTodo}
              size="lg"
              tone="muted"
            />
          )}
          size="sm"
          title={m.rooms_todos_empty_title()}
        />
      ) : null}
      {open.length > 0 ? (
        <View className="overflow-hidden rounded-lg border border-border bg-card">
          {open.map((todo) => (
            <TodosListItem
              disabled={update.isPending}
              key={todo.id}
              todo={todo}
              onRemove={remove}
              onToggle={toggle}
            />
          ))}
        </View>
      ) : null}
      {done.length > 0 ? (
        <SectionHeading
          expanded={isDoneShown}
          label={m.rooms_todos_done({ count: done.length })}
          onPress={() => setIsDoneShown(!isDoneShown)}
        />
      ) : null}
      {isDoneShown ? (
        <View className="overflow-hidden rounded-lg border border-border bg-card">
          {done.map((todo) => (
            <TodosListItem
              disabled={update.isPending}
              key={todo.id}
              todo={todo}
              onRemove={remove}
              onToggle={toggle}
            />
          ))}
        </View>
      ) : null}
      {todos.length > 0 ? (
        <Text tone="muted" variant="small">
          <EmptyLink onPress={() => onPrefill(m.rooms_todos_prompt())}>{m.rooms_prefill_create()}</EmptyLink>
        </Text>
      ) : null}
    </View>
  );
}

interface TodosListItemProps {
  todo: Todo;
  disabled: boolean;
  onToggle: (todo: Todo) => void;
  onRemove: (todo: Todo) => void;
}

function TodosListItem({ todo, disabled, onToggle, onRemove }: TodosListItemProps) {
  const tone = todo.isDone ? 'muted' : 'default';

  return (
    <Item size="sm">
      <Pressable
        accessibilityLabel={todo.isDone ? m.rooms_todos_reopen({ title: todo.title }) : m.rooms_todos_toggle({ title: todo.title })}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: todo.isDone, disabled }}
        disabled={disabled}
        hitSlop={8}
        onPress={() => onToggle(todo)}
      >
        <Icon icon={todo.isDone ? CircleCheck : Circle} tone={tone} />
      </Pressable>
      <ItemContent>
        <ItemTitle numberOfLines={2} tone={tone}>{todo.title}</ItemTitle>
      </ItemContent>
      <Button
        accessibilityLabel={m.rooms_todos_remove({ title: todo.title })}
        size="icon-sm"
        variant="ghost"
        onPress={() => onRemove(todo)}
      >
        <Icon icon={X} tone="muted" />
      </Button>
    </Item>
  );
}
