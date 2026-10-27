import { m } from '@repo/i18n/client';
import { Event, EventBody, EventContent, EventLabel, EventTrigger } from '../ai/event';
import { BotMention } from '../bots/bot-mention';
import type { ToolBot } from '@repo/client/client';

interface RoomsChatFailureProps {
  bot: ToolBot
  detail: string
}

export function RoomsChatFailure({ bot, detail }: RoomsChatFailureProps) {
  return (
    <Event>
      <EventTrigger status="error">
        <EventLabel>{m.rooms_event_failed()}</EventLabel>
        <BotMention activity="failed" bot={bot} />
      </EventTrigger>
      <EventContent>
        <EventBody>{detail}</EventBody>
      </EventContent>
    </Event>
  );
}
