import { toolPresentation } from '@repo/client/client';
import IconLucideAlarmClock from '~icons/lucide/alarm-clock';
import IconLucideBot from '~icons/lucide/bot';
import IconLucideCpu from '~icons/lucide/cpu';
import IconLucideFileText from '~icons/lucide/file-text';
import IconLucideKeyRound from '~icons/lucide/key-round';
import IconLucideLayoutDashboard from '~icons/lucide/layout-dashboard';
import IconLucideListTodo from '~icons/lucide/list-todo';
import IconLucideMessageCircleQuestion from '~icons/lucide/message-circle-question';
import IconLucidePlug from '~icons/lucide/plug';
import IconLucideSearch from '~icons/lucide/search';
import IconLucideSquarePen from '~icons/lucide/square-pen';
import IconLucideTerminal from '~icons/lucide/terminal';
import IconLucideWrench from '~icons/lucide/wrench';
import type { ToolIconKind } from '@repo/client/client';
import type { ComponentType, SVGProps } from 'react';

const toolLabelIcons = {
  terminal: IconLucideTerminal,
  file: IconLucideFileText,
  edit: IconLucideSquarePen,
  search: IconLucideSearch,
  bot: IconLucideBot,
  model: IconLucideCpu,
  question: IconLucideMessageCircleQuestion,
  secret: IconLucideKeyRound,
  routine: IconLucideAlarmClock,
  todo: IconLucideListTodo,
  artifact: IconLucideLayoutDashboard,
  mcp: IconLucidePlug,
  tool: IconLucideWrench,
} satisfies Record<ToolIconKind, ComponentType<SVGProps<SVGSVGElement>>>;

interface ToolIconProps {
  toolName: string
}

export function ToolIcon({ toolName }: ToolIconProps) {
  const Icon = toolLabelIcons[toolPresentation({ toolName }).icon];

  return <Icon />;
}
