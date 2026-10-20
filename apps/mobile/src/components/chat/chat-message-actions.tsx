import { ROOMS } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { useNavigation } from '@react-navigation/native';
import { setStringAsync } from 'expo-clipboard';
import { Copy, Reply, SmilePlus, TextSelect } from 'lucide-react-native';
import { match, P } from 'ts-pattern';
import { ActionSheet, ActionSheetChoice, ActionSheetChoices, ActionSheetGroup, ActionSheetItem } from '@/components/ui/action-sheet';
import { Text } from '@/components/ui/text';
import { useConnection } from '@/hooks/use-connection';
import { useMessageReaction } from '@/hooks/use-message-reaction';
import type { ChatActionsRouteParams } from '@/types/chat.types';
import type { NavigationRoot } from '@/types/navigation.types';
import type { RpcSession } from '@/types/rpc.types';

interface ChatMessageActionsProps {
  route: { params: ChatActionsRouteParams };
}

export function ChatMessageActions({ route }: ChatMessageActionsProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <ChatMessageActionsContent params={route.params} session={current} />)
    .otherwise(() => null);
}

interface ChatMessageActionsContentProps {
  session: RpcSession;
  params: ChatActionsRouteParams;
}

function ChatMessageActionsContent({ session, params }: ChatMessageActionsContentProps) {
  const navigation = useNavigation<NavigationRoot>();
  const { botId, conversationId, entryId, from, text, details } = params;
  const target = { botId, conversationId, entryId };
  const reaction = useMessageReaction(session, target);

  function react(emoji: string) {
    reaction.react(emoji);
    navigation.goBack();
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
            onPress={() => navigation.replace('ReactionPicker', target)}
          />
        </ActionSheetChoices>
      ) : null}
      <ActionSheetGroup>
        <ActionSheetItem icon={Reply} onPress={() => navigation.popTo('Chat', { botId, replyToEntryId: entryId }, { merge: true })}>
          {m.rooms_chat_reply()}
        </ActionSheetItem>
      </ActionSheetGroup>
      <ActionSheetGroup>
        <ActionSheetItem
          icon={Copy}
          onPress={() => {
            void setStringAsync(text);
            navigation.goBack();
          }}
        >
          {m.rooms_chat_copy()}
        </ActionSheetItem>
        <ActionSheetItem icon={TextSelect} onPress={() => navigation.replace('MessageText', { text })}>{m.rooms_chat_select_text()}</ActionSheetItem>
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
