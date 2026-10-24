import { useChatMessageReaction } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { match, P } from 'ts-pattern';
import { EmojiGrid } from '@/components/ui/emoji-grid';
import { useConnection } from '@/hooks/use-connection';
import type { ChatMessageReactionParams } from '@repo/client/client';

interface ChatReactionPickerProps {
  botId: string;
  conversationId: number;
  entryId: number;
}

export function ChatReactionPicker(params: ChatReactionPickerProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, () => <ChatReactionPickerContent params={params} />)
    .otherwise(() => null);
}

interface ChatReactionPickerContentProps {
  params: ChatMessageReactionParams;
}

function ChatReactionPickerContent({ params }: ChatReactionPickerContentProps) {
  const router = useRouter();
  const reaction = useChatMessageReaction(params);

  return (
    <EmojiGrid
      disabled={reaction.isPending}
      label={(emoji) => m.rooms_reaction_quick({ emoji })}
      selected={reaction.mine}
      onPick={(emoji) => {
        reaction.react(emoji);
        router.back();
      }}
    />
  );
}
