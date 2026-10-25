import { toolCollapsed, toolGroupState, toolIdentity, toolOutputText } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useState } from 'react';
import { ToolInput } from '@/components/tools/tool-input';
import { ToolLabel } from '@/components/tools/tool-label';
import { Tool, ToolCode, ToolContent, ToolGroup, ToolGroupItem, ToolGroupToggle } from '@/components/ui/ai/tool';
import type { DynamicToolUIPart } from 'ai';

interface RoomsChatToolsItemProps {
  part: DynamicToolUIPart
}

function RoomsChatToolsItem({ part }: RoomsChatToolsItemProps) {
  const [open, setOpen] = useState(false);
  const output = toolOutputText(part);

  return (
    <Tool open={open} onOpenChange={setOpen}>
      <ToolLabel part={part} />
      <ToolContent>
        <div className="flex min-w-0 flex-col gap-2">
          <ToolCode>{toolIdentity(part).identifier}</ToolCode>
          <ToolInput input={part.input} />
          {output ? <ToolCode variant={part.state === 'output-error' ? 'destructive' : 'default'}>{output}</ToolCode> : null}
        </div>
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
  const grouped = parts.length > 1;

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
      {parts.map((part) => (
        <ToolGroupItem
          collapsed={toolCollapsed({
            part,
            grouped,
            expanded,
          })}
          enter={live}
          key={part.toolCallId}
        >
          <RoomsChatToolsItem part={part} />
        </ToolGroupItem>
      ))}
    </ToolGroup>
  );
}
