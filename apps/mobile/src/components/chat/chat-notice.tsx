import { roomsMessageText } from '@openbots/client/client';
import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Trace, TraceCode, TraceContent, TraceRow } from '@/components/ui/trace';
import { chatNoticeTitle } from '@/services/chat/chat.utils';
import type { ChatMessage } from '@openbots/client/client';
import type { Bot } from '@openbots/contracts/universal';

interface ChatNoticeProps {
  message: ChatMessage;
  bot: Bot;
  peer?: Bot;
}

export function ChatNotice({ message, bot, peer }: ChatNoticeProps) {
  const [open, setOpen] = useState(false);
  const text = roomsMessageText(message);
  const who = peer ?? bot;

  const title = chatNoticeTitle({ message, bot });

  const avatar = (
    <Avatar
      avatar={who.avatar}
      name={who.name}
      size="xs"
    />
  );

  return (
    <Trace align="center" className="my-2">
      <TraceRow
        avatar={avatar}
        open={open}
        title={title}
        onPress={text ? () => setOpen(!open) : undefined}
      />
      {open ? (
        <TraceContent>
          <TraceCode>{text}</TraceCode>
        </TraceContent>
      ) : null}
    </Trace>
  );
}
