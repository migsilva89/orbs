import { TOOL_PEER_NAMES, toolGroupState, toolIdentity, toolInputTexts, toolOutputText, toolPeers, toolPresentation, toolPreview, toolRunning } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { AlarmClock, Bot, Cpu, FileText, LayoutDashboard, ListTodo, MessageCircleQuestion, Plug, Search, SquarePen, Terminal, Wrench } from 'lucide-react-native';
import { Fragment, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Avatar } from '@/components/ui/avatar';
import { Menu } from '@/components/ui/menu';
import { Text } from '@/components/ui/text';
import { Trace, TraceCode, TraceContent, TraceRow } from '@/components/ui/trace';
import type { TraceStatus } from '@/components/ui/trace';
import type { ToolIconKind, ToolPart, ToolPeer } from '@repo/client/client';
import type { Bot as BotItem } from '@repo/contracts/universal';
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

interface ChatToolsPeersProps {
  parts: ToolPart[];
  bots: BotItem[];
  senderId: string;
}

function ChatToolsPeers({ parts, bots, senderId }: ChatToolsPeersProps) {
  const router = useRouter();

  const peers = toolPeers(parts, bots);

  function openPair({ peer, conversationId }: ToolPeer) {
    if (conversationId !== undefined) {
      router.push({ pathname: '/chat/[botId]/with/[peerId]', params: { botId: senderId, peerId: peer.id, conversationId } });
    }
  }

  return (
    <View className="flex-row flex-wrap items-center justify-center gap-x-1.5 gap-y-1 px-4 py-1">
      <Text tone="muted" variant="trace-preview">{parts.length > 1 ? m.rooms_pair_messages({ count: parts.length }) : m.rooms_pair_messaged()}</Text>
      {peers.length > 2 ? (
        <Menu
          items={peers.map((target) => ({
            label: target.peer.name,
            onSelect: () => openPair(target),
          }))}
        >
          <View className="flex-row items-center gap-1 rounded-full px-1.5 py-0.5">
            <View className="flex-row">
              {peers.slice(0, 3).map(({ peer }, index) => (
                <View className={index > 0 ? '-ml-1.5 rounded-full border-2 border-background' : 'rounded-full border-2 border-background'} key={peer.id}>
                  <Avatar
                    avatar={peer.avatar}
                    name={peer.name}
                    size="xs"
                  />
                </View>
              ))}
            </View>
            <Text tone="muted" variant="trace-preview">{m.rooms_pair_bots({ count: peers.length })}</Text>
          </View>
        </Menu>
      ) : peers.map((target, index) => (
        <Fragment key={target.peer.id}>
          {index > 0 ? <Text tone="muted" variant="trace-preview">{index === peers.length - 1 ? m.rooms_pair_and() : ','}</Text> : null}
          <Pressable
            accessibilityRole="link"
            className="flex-row items-center gap-1 rounded-full px-1.5 py-0.5 active:bg-accent"
            disabled={target.conversationId === undefined}
            onPress={() => openPair(target)}
          >
            <Avatar
              avatar={target.peer.avatar}
              name={target.peer.name}
              size="xs"
            />
            <Text tone="muted" variant="trace-preview">{target.peer.name}</Text>
          </Pressable>
        </Fragment>
      ))}
      {parts.some(toolRunning) ? <ActivityIndicator size="small" /> : null}
    </View>
  );
}

interface ChatToolsProps {
  parts: ToolPart[];
  bots: BotItem[];
  senderId: string;
}

export function ChatTools({ parts, bots, senderId }: ChatToolsProps) {
  const [expanded, setExpanded] = useState(false);
  const peers = parts.filter((part) => TOOL_PEER_NAMES.has(part.toolName));
  const others = parts.filter((part) => !TOOL_PEER_NAMES.has(part.toolName));
  const isGrouped = others.length > 1;
  const shown = isGrouped && !expanded ? others.filter(toolRunning) : others;

  return (
    <Trace align="center">
      {peers.length > 0 ? (
        <ChatToolsPeers
          bots={bots}
          parts={peers}
          senderId={senderId}
        />
      ) : null}
      {isGrouped ? (
        <TraceRow
          icon={Wrench}
          open={expanded}
          status={TOOL_TRACE_STATUS[toolGroupState({ parts: others })]}
          title={m.rooms_chat_tools_count({ count: others.length })}
          onPress={() => setExpanded(!expanded)}
        />
      ) : null}
      {shown.map((part) => <ChatToolsItem key={part.toolCallId} part={part} />)}
    </Trace>
  );
}
