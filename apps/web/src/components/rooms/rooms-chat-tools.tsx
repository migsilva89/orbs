import { TOOL_PEER_NAMES, toolCollapsed, toolGroupState, toolIdentity, toolInputText, toolOutputText } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { getLocale } from '@openbots/i18n/runtime';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { ToolInput } from '@/components/tools/tool-input';
import { ToolLabel } from '@/components/tools/tool-label';
import { Tool, ToolCode, ToolContent, ToolGroup, ToolGroupItem, ToolGroupToggle, ToolTrigger } from '@/components/ui/ai/tool';
import { rpc } from '@/services/rpc/rpc.client';
import type { DynamicToolUIPart } from 'ai';

interface RoomsChatToolsItemProps {
  parts: DynamicToolUIPart[]
}

function RoomsChatToolsItem({ parts }: RoomsChatToolsItemProps) {
  const [open, setOpen] = useState(false);
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());

  const targets = parts.map((part) => {
    const botId = TOOL_PEER_NAMES.has(part.toolName) ? toolInputText({ input: part.input, key: 'botId' }) : undefined;

    return botId ? bots.find((item) => item.id === botId) : undefined;
  });

  const [part] = parts;
  const [target] = targets;

  const names = new Intl.ListFormat(getLocale(), { type: 'conjunction' }).formatToParts(targets.flatMap((item) => (item ? [item.name] : []))).map((piece, index) => {
    const named = piece.type === 'element' ? bots.find((item) => item.name === piece.value) : undefined;

    return named ? (
      <span className="inline-flex items-center gap-1.5" key={`${named.id}-${index}`}>
        <BotAvatar bot={named} size={14} />
        {named.name}
      </span>
    ) : piece.value;
  });

  return (
    <Tool open={open} onOpenChange={setOpen}>
      {parts.length > 1 ? (
        <ToolTrigger
          name={m.rooms_pair_messaged()}
          preview={<span className="inline-flex items-center gap-1.5">{names}</span>}
          state={toolGroupState({ parts })}
        />
      ) : (
        <ToolLabel
          icon={target ? <BotAvatar bot={target} size={14} /> : undefined}
          label={target ? m.rooms_pair_messaged() : undefined}
          part={part}
          preview={target?.name}
        />
      )}
      <ToolContent>
        {parts.map((item) => {
          const output = toolOutputText(item);

          return (
            <div className="flex min-w-0 flex-col gap-2" key={item.toolCallId}>
              <ToolCode>{toolIdentity(item).identifier}</ToolCode>
              <ToolInput input={item.input} />
              {output ? <ToolCode variant={item.state === 'output-error' ? 'destructive' : 'default'}>{output}</ToolCode> : null}
            </div>
          );
        })}
      </ToolContent>
    </Tool>
  );
}

interface RoomsChatToolsProps {
  parts: DynamicToolUIPart[]
  live: boolean
}

export function RoomsChatTools({ parts, live }: RoomsChatToolsProps) {
  const [expanded, setExpanded] = useState(false);
  const messaged = parts.filter((part) => TOOL_PEER_NAMES.has(part.toolName));
  const combined = messaged.length > 1;

  const rows = parts.flatMap((part) => {
    if (!combined || !messaged.includes(part)) {
      return [[part]];
    }

    return part === messaged[0] ? [messaged] : [];
  });

  const grouped = rows.length > 1;

  return (
    <ToolGroup>
      {grouped ? (
        <ToolGroupItem enter={live}>
          <ToolGroupToggle
            open={expanded}
            state={toolGroupState({ parts })}
            onClick={() => setExpanded(!expanded)}
          >
            {m.rooms_chat_tools_count({ count: parts.length })}
          </ToolGroupToggle>
        </ToolGroupItem>
      ) : null}
      {rows.map((row) => (
        <ToolGroupItem
          collapsed={row.every((part) => toolCollapsed({
            part,
            grouped,
            expanded,
          }))}
          enter={live}
          key={row[0]?.toolCallId}
        >
          <RoomsChatToolsItem
            parts={row}
          />
        </ToolGroupItem>
      ))}
    </ToolGroup>
  );
}
