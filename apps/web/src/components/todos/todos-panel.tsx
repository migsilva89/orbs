import { m } from '@repo/i18n/client';
import { PanelRow } from '@repo/ui/panel';
import { SettingsPanel } from '@repo/ui/settings/settings-panel';
import { TodosList } from '@/components/todos/todos-list';
import IconListTodo from '~icons/lucide/list-todo';
import type { Bot } from '@repo/contracts/universal';

interface TodosPanelProps {
  bot: Bot
}

export function TodosPanel({ bot }: TodosPanelProps) {
  return (
    <SettingsPanel
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
