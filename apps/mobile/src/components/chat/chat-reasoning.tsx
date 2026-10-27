import { m } from '@repo/i18n/client';
import { BotMention } from '@/components/bots/bot-mention';
import { Event, EventBody, EventContent, EventLabel, EventList, EventTrigger } from '@/components/ui/event';
import { Markdown } from '@/components/ui/markdown';
import type { Bot } from '@repo/contracts/universal';

interface ChatReasoningProps {
  bot: Pick<Bot, 'name' | 'avatar'>;
  text: string;
  isStreaming: boolean;
}

export function ChatReasoning({ bot, text, isStreaming }: ChatReasoningProps) {
  return (
    <EventList>
      <Event defaultOpen={isStreaming}>
        <EventTrigger status={isStreaming ? 'running' : undefined}>
          <EventLabel>{isStreaming ? m.rooms_event_reasoning_streaming() : m.rooms_event_reasoning()}</EventLabel>
          <BotMention animate={isStreaming} bot={bot} />
        </EventTrigger>
        <EventContent>
          <EventBody>
            <Markdown isStreaming={isStreaming} tone="muted">{text}</Markdown>
          </EventBody>
        </EventContent>
      </Event>
    </EventList>
  );
}
