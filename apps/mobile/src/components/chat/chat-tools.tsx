import { toolInputTexts, toolOutputText, toolPresentation, toolPreview, toolReadableName } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { AlarmClock, Bot, Cpu, FileText, KeyRound, LayoutDashboard, ListTodo, MessageCircleQuestion, Plug, Search, SquarePen, Terminal, Wrench } from 'lucide-react-native';
import { View } from 'react-native';
import { Event, EventContent, EventDetails, EventItem, EventItems, EventLabel, EventList, EventName, EventTrigger } from '@/components/ui/event';
import { Icon } from '@/components/ui/icon';
import { MessageCode } from '@/components/ui/message';
import { Text } from '@/components/ui/text';
import type { EventStatus } from '@/components/ui/event';
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
  secret: KeyRound,
  routine: AlarmClock,
  todo: ListTodo,
  artifact: LayoutDashboard,
  mcp: Plug,
  tool: Wrench,
} satisfies Record<ToolIconKind, LucideIcon>;

const CHAT_TOOL_STATUS = {
  'input-streaming': 'running',
  'input-available': 'running',
  'approval-requested': 'approval',
  'approval-responded': 'running',
  'output-available': 'done',
  'output-error': 'error',
  'output-denied': 'denied',
} satisfies Record<ToolPart['state'], EventStatus>;

const CHAT_TOOL_PRIORITY: EventStatus[] = ['running', 'approval', 'error', 'denied', 'done'];

interface ChatToolsDetailsProps {
  part: ToolPart;
}

function ChatToolsDetails({ part }: ChatToolsDetailsProps) {
  const output = toolOutputText(part);

  return (
    <>
      {toolInputTexts(part).map(({ key, value }) => (
        <View className="flex-row gap-3" key={key}>
          <Text tone="muted" variant="small">{toolReadableName(key)}</Text>
          <Text
            selectable
            className="flex-1"
            numberOfLines={6}
            variant="small"
          >
            {value}
          </Text>
        </View>
      ))}
      {output ? <MessageCode tone={part.state === 'output-error' ? 'destructive' : 'default'}>{output}</MessageCode> : null}
    </>
  );
}

interface ChatToolsProps {
  parts: ToolPart[];
}

export function ChatTools({ parts }: ChatToolsProps) {
  const statuses = parts.map((part) => CHAT_TOOL_STATUS[part.state]);
  const status = CHAT_TOOL_PRIORITY.find((item) => statuses.includes(item));
  const [single] = parts;

  if (parts.length === 1) {
    const presentation = toolPresentation(single);

    return (
      <EventList>
        <Event>
          <EventTrigger status={status}>
            <EventLabel>{presentation.label}</EventLabel>
            <EventName icon={<Icon icon={CHAT_TOOL_ICONS[presentation.icon]} tone="subtle" />}>{toolPreview(single)}</EventName>
          </EventTrigger>
          <EventContent>
            <EventDetails>
              <ChatToolsDetails part={single} />
            </EventDetails>
          </EventContent>
        </Event>
      </EventList>
    );
  }

  const stack = [...new Set(parts.map((part) => toolPresentation(part).icon))].slice(0, 3).map((icon) => (
    <Icon
      icon={CHAT_TOOL_ICONS[icon]}
      key={icon}
      size="sm"
      tone="subtle"
    />
  ));

  return (
    <EventList>
      <Event>
        <EventTrigger status={status}>
          <EventLabel>{m.rooms_event_tools_used()}</EventLabel>
          <EventName icon={stack}>{m.rooms_event_tools_count({ count: parts.length })}</EventName>
        </EventTrigger>
        <EventContent>
          <EventItems>
            {parts.map((part) => {
              const presentation = toolPresentation(part);

              return (
                <EventItem
                  description={part.state === 'output-error' ? part.errorText.split('\n')[0] : undefined}
                  icon={<Icon icon={CHAT_TOOL_ICONS[presentation.icon]} tone="muted" />}
                  key={part.toolCallId}
                  label={presentation.label}
                  preview={toolPreview(part)}
                  status={CHAT_TOOL_STATUS[part.state]}
                >
                  <ChatToolsDetails part={part} />
                </EventItem>
              );
            })}
          </EventItems>
        </EventContent>
      </Event>
    </EventList>
  );
}
