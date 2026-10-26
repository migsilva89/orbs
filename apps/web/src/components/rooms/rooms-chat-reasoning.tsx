import { m } from '@repo/i18n/client';
import { useState } from 'react';
import { BotMention } from '@/components/bots/bot-mention';
import { Event, EventBody, EventContent, EventLabel, EventTrigger } from '@/components/ui/ai/event';
import { Response } from '@/components/ui/ai/response';
import type { ToolBot } from '@repo/client/client';

interface RoomsChatReasoningProps {
  bot: ToolBot
  text: string
  isStreaming: boolean
}

export function RoomsChatReasoning({ bot, text, isStreaming }: RoomsChatReasoningProps) {
  const [open, setOpen] = useState<boolean>();

  return (
    <Event open={open ?? isStreaming} onOpenChange={setOpen}>
      <EventTrigger status={isStreaming ? 'running' : undefined}>
        <EventLabel>{isStreaming ? m.rooms_event_reasoning_streaming() : m.rooms_event_reasoning()}</EventLabel>
        <BotMention
          activity={isStreaming ? 'thinking' : undefined}
          animate={isStreaming}
          bot={bot}
        />
      </EventTrigger>
      <EventContent>
        <EventBody variant="markdown">
          <Response>{text}</Response>
        </EventBody>
      </EventContent>
    </Event>
  );
}
