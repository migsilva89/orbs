import { toolIdentity, toolPresentation, toolPreview } from '@repo/client/client';
import { ToolTrigger } from '@/components/ui/ai/tool';
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
import type { DynamicToolUIPart } from 'ai';
import type { ReactNode } from 'react';

const toolLabelIcons = {
  terminal: <IconLucideTerminal />,
  file: <IconLucideFileText />,
  edit: <IconLucideSquarePen />,
  search: <IconLucideSearch />,
  bot: <IconLucideBot />,
  model: <IconLucideCpu />,
  question: <IconLucideMessageCircleQuestion />,
  secret: <IconLucideKeyRound />,
  routine: <IconLucideAlarmClock />,
  todo: <IconLucideListTodo />,
  artifact: <IconLucideLayoutDashboard />,
  mcp: <IconLucidePlug />,
  tool: <IconLucideWrench />,
} satisfies Record<ToolIconKind, ReactNode>;

interface ToolLabelProps {
  part: DynamicToolUIPart
  avatar?: ReactNode
  label?: string
  icon?: ReactNode
  preview?: string
}

export function ToolLabel({ part, avatar, label, icon, preview }: ToolLabelProps) {
  const presentation = toolPresentation(part);

  return (
    <ToolTrigger
      avatar={avatar}
      icon={icon ?? toolLabelIcons[presentation.icon]}
      name={label ?? presentation.label}
      preview={preview ?? toolPreview(part)}
      state={part.state}
      title={toolIdentity(part).identifier}
    />
  );
}
