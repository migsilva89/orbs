import { TOOL_PEER_NAMES, toolGroupState, toolIdentity, toolInputText, toolInputTexts, toolOutputText, toolPresentation, toolPreview, toolRunning } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { AlarmClock, Bot, Cpu, FileText, LayoutDashboard, ListTodo, MessageCircleQuestion, Plug, Search, SquarePen, Terminal, Wrench } from 'lucide-react-native';
import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Trace, TraceCode, TraceContent, TraceRow } from '@/components/ui/trace';
import type { TraceStatus } from '@/components/ui/trace';
import type { ToolIconKind, ToolPart } from '@openbots/client/client';
import type { Bot as BotItem } from '@openbots/contracts/universal';
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
  bots: BotItem[];
}

function ChatToolsItem({ part, bots }: ChatToolsItemProps) {
  const [open, setOpen] = useState(false);
  const presentation = toolPresentation(part);
  const peerId = TOOL_PEER_NAMES.has(part.toolName) ? toolInputText({ input: part.input, key: 'botId' }) : undefined;
  const peer = peerId ? bots.find((item) => item.id === peerId) : undefined;
  const output = toolOutputText(part);

  const avatar = peer ? (
    <Avatar
      avatar={peer.avatar}
      name={peer.name}
      size="xs"
    />
  ) : undefined;

  return (
    <>
      <TraceRow
        avatar={avatar}
        icon={CHAT_TOOL_ICONS[presentation.icon]}
        open={open}
        preview={peer?.name ?? toolPreview(part)}
        status={TOOL_TRACE_STATUS[part.state]}
        title={peer ? m.rooms_pair_messaged() : presentation.label}
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
  bots: BotItem[];
}

export function ChatTools({ parts, bots }: ChatToolsProps) {
  const [expanded, setExpanded] = useState(false);
  const peers = parts.filter((part) => TOOL_PEER_NAMES.has(part.toolName));
  const others = parts.filter((part) => !TOOL_PEER_NAMES.has(part.toolName));
  const isGrouped = others.length > 1;
  const shown = isGrouped && !expanded ? others.filter(toolRunning) : others;

  return (
    <Trace align="center">
      {peers.map((part) => (
        <ChatToolsItem
          bots={bots}
          key={part.toolCallId}
          part={part}
        />
      ))}
      {isGrouped ? (
        <TraceRow
          icon={Wrench}
          open={expanded}
          status={TOOL_TRACE_STATUS[toolGroupState({ parts: others })]}
          title={m.rooms_chat_tools_count({ count: others.length })}
          onPress={() => setExpanded(!expanded)}
        />
      ) : null}
      {shown.map((part) => (
        <ChatToolsItem
          bots={bots}
          key={part.toolCallId}
          part={part}
        />
      ))}
    </Trace>
  );
}
