import { mentionQuote } from '@openbots/client/client';
import { useLocalSearchParams } from 'expo-router';
import { ChatRoom } from '@/components/chat/chat-room';
import type { ChatRouteParams } from '@/types/chat.types';

export default function ChatRoute() {
  const { botId, replyToEntryId, quote, quoteEntryId, prefill } = useLocalSearchParams<ChatRouteParams>();

  return (
    <ChatRoom
      botId={botId}
      prefill={prefill}
      quote={quote ? mentionQuote({ text: quote, entryId: Number(quoteEntryId) }) : undefined}
      replyToEntryId={replyToEntryId ? Number(replyToEntryId) : undefined}
    />
  );
}
