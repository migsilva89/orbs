import { m } from '@repo/i18n/client';
import { BotMention } from '@/components/bots/bot-mention';
import { Event, EventBody, EventContent, EventLabel, EventList, EventTrigger } from '@/components/ui/event';
import { Text } from '@/components/ui/text';
import type { Bot } from '@repo/contracts/universal';

interface ChatFailureProps {
  bot: Pick<Bot, 'name' | 'avatar'>;
  detail: string;
}

export function ChatFailure({ bot, detail }: ChatFailureProps) {
  return (
    <EventList>
      <Event>
        <EventTrigger status="error">
          <EventLabel>{m.rooms_event_failed()}</EventLabel>
          <BotMention bot={bot} />
        </EventTrigger>
        <EventContent>
          <EventBody>
            <Text selectable>{detail}</Text>
          </EventBody>
        </EventContent>
      </Event>
    </EventList>
  );
}
