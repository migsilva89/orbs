import { roomsMessageText } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ChatMessage, ChatPart, ToolBot } from '@openbots/client/client';

interface RoomsChatNoticeProps {
  message: ChatMessage
  bot: ToolBot
}

export function RoomsChatNotice({ message, bot }: RoomsChatNoticeProps) {
  const name = message.metadata?.authorName ?? '';
  const text = roomsMessageText(message);

  function noticeLabel(part: ChatPart | undefined): string {
    if (part?.type === 'data-subagent') {
      return part.data.status === 'answered' ? m.rooms_notice_subagent_answered({ name: part.data.name }) : m.rooms_notice_subagent_failed({ name: part.data.name });
    }

    if (part?.type === 'data-compaction') {
      return m.rooms_notice_compacted();
    }

    return part?.type === 'data-reset' ? m.rooms_notice_reset() : name;
  }

  const label = noticeLabel(message.parts[0]);

  return (
    <Collapsible
      className="my-3 flex zoom-[0.8] flex-col items-center"
      data-message-id={message.id}
      disabled={!text}
    >
      <CollapsibleTrigger asChild>
        <Button
          size="xs"
          type="button"
          variant="link-muted"
        >
          <BotAvatar bot={bot} size={14} />
          <span className="truncate">{label}</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="mt-1 max-w-prose rounded-2xl border px-3 py-2 text-xs whitespace-pre-wrap text-muted-foreground">{text}</p>
      </CollapsibleContent>
    </Collapsible>
  );
}
