import { m } from '@openbots/i18n/client';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { TodosList } from '@/components/todos/todos-list';
import { PanelRow } from '@/components/ui/panel';
import IconListTodo from '~icons/lucide/list-todo';
import type { Bot } from '@openbots/contracts/universal';

interface TodosPanelProps {
  bot: Bot
}

export function TodosPanel({ bot }: TodosPanelProps) {
  return (
    <SettingsPanel
      description={m.bots_todos_hint()}
      icon={IconListTodo}
      id="todos"
      title={m.rooms_todos()}
    >
      <PanelRow className="flex-col items-stretch">
        <TodosList bot={bot} />
      </PanelRow>
    </SettingsPanel>
  );
}
