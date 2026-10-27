import { toolIdentity, toolOutputText, toolPresentation, toolPreview } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { Event, EventContent, EventDetails, EventItem, EventItems, EventLabel, EventName, EventTrigger } from '../ai/event';
import { ToolCodeBlock } from '../ai/tool';
import { ToolIcon } from '../tools/tool-icon';
import { ToolInput } from '../tools/tool-input';
import type { EventStatus } from '../ai/event';
import type { DynamicToolUIPart } from 'ai';

const ROOMS_CHAT_TOOLS_STATUS = {
  'input-streaming': 'running',
  'input-available': 'running',
  'approval-requested': 'approval',
  'approval-responded': 'running',
  'output-available': 'done',
  'output-error': 'error',
  'output-denied': 'denied',
} satisfies Record<DynamicToolUIPart['state'], EventStatus>;

const ROOMS_CHAT_TOOLS_PRIORITY: EventStatus[] = ['running', 'approval', 'error', 'denied', 'done'];

interface RoomsChatToolsDetailsProps {
  part: DynamicToolUIPart
}

function RoomsChatToolsDetails({ part }: RoomsChatToolsDetailsProps) {
  const output = toolOutputText(part);

  return (
    <>
      <ToolInput input={part.input} />
      {output ? <ToolCodeBlock variant={part.state === 'output-error' ? 'destructive' : 'default'}>{output}</ToolCodeBlock> : null}
    </>
  );
}

interface RoomsChatToolsProps {
  parts: DynamicToolUIPart[]
}

export function RoomsChatTools({ parts }: RoomsChatToolsProps) {
  const statuses = parts.map((part) => ROOMS_CHAT_TOOLS_STATUS[part.state]);
  const status = ROOMS_CHAT_TOOLS_PRIORITY.find((item) => statuses.includes(item));
  const [single] = parts;

  if (parts.length === 1) {
    const presentation = toolPresentation(single);

    return (
      <Event>
        <EventTrigger status={status} title={toolIdentity(single).identifier}>
          <EventLabel>{presentation.label}</EventLabel>
          <EventName icon={<ToolIcon icon={presentation.icon} />}>{toolPreview(single)}</EventName>
        </EventTrigger>
        <EventContent>
          <EventDetails>
            <RoomsChatToolsDetails part={single} />
          </EventDetails>
        </EventContent>
      </Event>
    );
  }

  const icons = [...new Set(parts.map((part) => toolPresentation(part).icon))].slice(0, 3);

  return (
    <Event>
      <EventTrigger status={status}>
        <EventLabel>{m.rooms_event_tools_used()}</EventLabel>
        <EventName icon={icons.map((icon) => <ToolIcon icon={icon} key={icon} />)}>{m.rooms_event_tools_count({ count: parts.length })}</EventName>
      </EventTrigger>
      <EventContent>
        <EventItems>
          {parts.map((part) => {
            const presentation = toolPresentation(part);

            return (
              <EventItem
                description={part.state === 'output-error' ? part.errorText.split('\n')[0] : undefined}
                icon={<ToolIcon icon={presentation.icon} />}
                key={part.toolCallId}
                label={presentation.label}
                preview={toolPreview(part)}
                status={ROOMS_CHAT_TOOLS_STATUS[part.state]}
              >
                <RoomsChatToolsDetails part={part} />
              </EventItem>
            );
          })}
        </EventItems>
      </EventContent>
    </Event>
  );
}
