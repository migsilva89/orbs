import { toolGroupState, toolIdentity, toolInputTexts, toolOutputText, toolPresentation, toolPreview, toolRunning } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { AlarmClock, Bot, Cpu, FileText, LayoutDashboard, ListTodo, MessageCircleQuestion, Plug, Search, SquarePen, Terminal, Wrench } from 'lucide-react-native';
import { useState } from 'react';
import { Trace, TraceCode, TraceContent, TraceRow } from '@/components/ui/trace';
import type { TraceStatus } from '@/components/ui/trace';
import type { ToolIconKind, ToolPart } from '@repo/client/client';
import type { LucideIcon } from 'lucide-react-native';

const CHAT_TOOL_ICONS = {
  terminal: Terminal,
  file: FileText,
  edit: SquarePen,
  search: Search,
  bot: Bot,
  model: Cpu,
  question: MessageCircleQuestion,
  routine: AlarmClock,
  todo: ListTodo,
  artifact: LayoutDashboard,
  mcp: Plug,
  tool: Wrench,
} satisfies Record<ToolIconKind, LucideIcon>;

const TOOL_TRACE_STATUS = {
  'input-streaming': 'running',
  'input-available': 'running',
  'approval-requested': 'running',
  'approval-responded': 'running',
  'output-available': 'done',
  'output-error': 'error',
  'output-denied': 'done',
} satisfies Record<ToolPart['state'], TraceStatus>;

interface ChatToolsItemProps {
  part: ToolPart;
}

function ChatToolsItem({ part }: ChatToolsItemProps) {
  const [open, setOpen] = useState(false);
  const presentation = toolPresentation(part);
  const output = toolOutputText(part);

  return (
    <>
      <TraceRow
        icon={CHAT_TOOL_ICONS[presentation.icon]}
        open={open}
        preview={toolPreview(part)}
        status={TOOL_TRACE_STATUS[part.state]}
        title={presentation.label}
        onPress={() => setOpen(!open)}
      />
      {open ? (
        <TraceContent>
          <TraceCode>{[toolIdentity(part).identifier, ...toolInputTexts(part).map((item) => `${item.key}: ${item.value}`)].join('\n')}</TraceCode>
          {output ? <TraceCode tone={part.state === 'output-error' ? 'destructive' : 'default'}>{output}</TraceCode> : null}
        </TraceContent>
      ) : null}
    </>
  );
}

interface ChatToolsProps {
  parts: ToolPart[];
}

export function ChatTools({ parts }: ChatToolsProps) {
  const [expanded, setExpanded] = useState(false);
  const isGrouped = parts.length > 1;
  const shown = isGrouped && !expanded ? parts.filter(toolRunning) : parts;

  return (
    <Trace align="center">
      {isGrouped ? (
        <TraceRow
          icon={Wrench}
          open={expanded}
          status={TOOL_TRACE_STATUS[toolGroupState({ parts })]}
          title={m.rooms_chat_tools_count({ count: parts.length })}
          onPress={() => setExpanded(!expanded)}
        />
      ) : null}
      {shown.map((part) => <ChatToolsItem key={part.toolCallId} part={part} />)}
    </Trace>
  );
}
