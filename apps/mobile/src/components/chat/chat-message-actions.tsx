import { ROOMS } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { setStringAsync } from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Copy, Reply, SmilePlus, TextSelect } from 'lucide-react-native';
import { match, P } from 'ts-pattern';
import { ActionSheet, ActionSheetChoice, ActionSheetChoices, ActionSheetGroup, ActionSheetItem } from '@/components/ui/action-sheet';
import { Text } from '@/components/ui/text';
import { useChatReturn } from '@/hooks/use-chat-return';
import { useConnection } from '@/hooks/use-connection';
import { useMessageReaction } from '@/hooks/use-message-reaction';
import { useToast } from '@/hooks/use-toast';
import type { ChatReactionParams } from '@/types/chat.types';
import type { RpcSession } from '@/types/rpc.types';

interface ChatMessageActionsProps extends ChatReactionParams {
  from: 'user' | 'assistant';
  text: string;
  details: string[];
}

export function ChatMessageActions(params: ChatMessageActionsProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <ChatMessageActionsContent params={params} session={current} />)
    .otherwise(() => null);
}

interface ChatMessageActionsContentProps {
  session: RpcSession;
  params: ChatMessageActionsProps;
}

function ChatMessageActionsContent({ session, params }: ChatMessageActionsContentProps) {
  const toast = useToast();
  const router = useRouter();
  const returnToChat = useChatReturn();
  const { botId, conversationId, entryId, from, text, details } = params;
  const target = { botId, conversationId, entryId };
  const reaction = useMessageReaction(session, target);

  function react(emoji: string) {
    reaction.react(emoji);
    router.back();
  }

  return (
    <ActionSheet>
      {from === 'assistant' ? (
        <ActionSheetChoices>
          {[...ROOMS.quickReactions, ...ROOMS.moreReactions].map((emoji) => (
            <ActionSheetChoice
              accessibilityLabel={m.rooms_reaction_quick({ emoji })}
              disabled={reaction.isPending}
              key={emoji}
              selected={reaction.mine.includes(emoji)}
              onPress={() => react(emoji)}
            >
              {emoji}
            </ActionSheetChoice>
          ))}
          <ActionSheetChoice
            accessibilityLabel={m.rooms_reaction_more()}
            icon={SmilePlus}
            onPress={() => router.replace({ pathname: '/chat/[botId]/react', params: target })}
          />
        </ActionSheetChoices>
      ) : null}
      <ActionSheetGroup>
        <ActionSheetItem icon={Reply} onPress={() => returnToChat({ botId, replyToEntryId: String(entryId) })}>
          {m.rooms_chat_reply()}
        </ActionSheetItem>
      </ActionSheetGroup>
      <ActionSheetGroup>
        <ActionSheetItem
          icon={Copy}
          onPress={() => {
            void setStringAsync(text).then(
              () => toast.show({ message: m.rooms_chat_copied(), variant: 'default' }),
              () => toast.show({ message: m.ui_copy_failed() }),
            );
            router.back();
          }}
        >
          {m.rooms_chat_copy()}
        </ActionSheetItem>
        <ActionSheetItem
          icon={TextSelect}
          onPress={() => router.replace({ pathname: '/chat/[botId]/text', params: { botId, entryId, text } })}
        >
          {m.rooms_chat_select_text()}
        </ActionSheetItem>
      </ActionSheetGroup>
      {details.map((line) => (
        <Text
          className="mx-5"
          key={line}
          tone="muted"
          variant="small"
        >
          {line}
        </Text>
      ))}
    </ActionSheet>
  );
}
