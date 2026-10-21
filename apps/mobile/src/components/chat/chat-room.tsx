import { useKeyboardChatComposerInset } from '@legendapp/list/keyboard';
import { botBubble, CHAT, chatActivity, chatEntryIds, chatFailure, chatLive, chatMessages, chatOutgoingMessages, chatQueued, roomsMessageText, roomsReactionGroups, roomsTimeLabel } from '@openbots/client/client';
import { chatHistoryOptions, chatViewOptions, useChatReaction, useChatReactions } from '@openbots/client/react';
import { getLocale, m } from '@openbots/i18n/client';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { match, P } from 'ts-pattern';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { KeyboardSticky } from '@/components/ui/keyboard-sticky';
import { MessageList } from '@/components/ui/message-list';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useChatUnread } from '@/hooks/use-chat-unread';
import { useConnection } from '@/hooks/use-connection';
import { chatMessageDetails } from '@/services/chat/chat.utils';
import { ChatComposer } from './chat-composer';
import { ChatHeader } from './chat-header';
import { ChatMessage } from './chat-message';
import { ChatRuns } from './chat-runs';
import type { RpcSession } from '@/types/rpc.types';
import type { LegendListRef } from '@legendapp/list/react-native';
import type { ChatMessage as ChatMessageItem, ChatOutgoing, MentionItem } from '@openbots/client/client';
import type { Bot, ConversationView } from '@openbots/contracts/universal';

interface ChatRoomProps {
  botId: string;
  replyToEntryId?: number;
  quote?: MentionItem;
  prefill?: string;
}

export function ChatRoom({ botId, replyToEntryId, quote, prefill }: ChatRoomProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => (
      <ChatRoomContent
        botId={botId}
        prefill={prefill}
        quote={quote}
        replyToEntryId={replyToEntryId}
        session={current}
      />
    ))
    .otherwise(() => null);
}

interface ChatRoomContentProps {
  session: RpcSession;
  botId: string;
  replyToEntryId?: number;
  quote?: MentionItem;
  prefill?: string;
}

function ChatRoomContent({ session, botId, replyToEntryId, quote, prefill }: ChatRoomContentProps) {
  const bots = useQuery(session.rpc.bots.list.queryOptions());
  const view = useQuery(chatViewOptions(session, { botId }));
  const bot = bots.data?.find((item) => item.id === botId);

  return (
    <Screen padding="none" scroll={false}>
      {match({
        bot,
        view: view.data,
        isError: bots.isError || view.isError,
      })
        .with({ bot: P.nonNullable, view: P.nonNullable }, (ready) => (
          <ChatRoomView
            bot={ready.bot}
            bots={bots.data ?? []}
            prefill={prefill}
            quote={quote}
            replyToEntryId={replyToEntryId}
            session={session}
            view={ready.view}
          />
        ))
        .with({ isError: true }, () => (
          <View className="gap-4 px-5 pt-24">
            <Alert variant="destructive">
              <AlertTitle>{m.mobile_chat_error_title()}</AlertTitle>
              <AlertDescription>{m.mobile_bots_failed()}</AlertDescription>
            </Alert>
            <Button
              onPress={() => void Promise.all([
                bots.refetch(),
                view.refetch(),
              ])}
            >{m.mobile_retry()}</Button>
          </View>
        ))
        .otherwise(() => (
          <View accessibilityLabel={m.mobile_chat_loading()} className="flex-1 items-center justify-center">
            <Text tone="muted">{m.mobile_chat_loading()}</Text>
          </View>
        ))}
    </Screen>
  );
}

interface ChatRoomViewProps {
  session: RpcSession;
  bot: Bot;
  bots: Bot[];
  view: ConversationView;
  replyToEntryId?: number;
  quote?: MentionItem;
  prefill?: string;
}

function ChatRoomView({ session, bot, bots, view, replyToEntryId, quote, prefill }: ChatRoomViewProps) {
  const router = useRouter();
  const list = useRef<LegendListRef>(null);
  const composer = useRef(null);
  const [outgoing, setOutgoing] = useState<ChatOutgoing[]>([]);
  const { contentInsetEndAdjustment, onComposerLayout } = useKeyboardChatComposerInset(list, composer);
  const { conversationId } = view;

  const history = useInfiniteQuery(chatHistoryOptions(session, {
    botId: bot.id,
    conversationId,
    cursor: view.historyCursor,
  }));

  const { data: pending = [] } = useQuery(session.rpc.tools.pending.queryOptions({ input: { botId: bot.id } }));
  const older = [...(history.data?.pages.flatMap((page) => page.items) ?? [])].reverse();
  const approvals = pending.filter((approval) => approval.conversationId === conversationId);
  const { data: questions = [] } = useQuery(session.rpc.conversation.questions.queryOptions({ input: { botId: bot.id, conversationId } }));
  const queued = chatQueued(view);
  const activity = chatActivity(view);
  const bubble = botBubble(bot);

  const messages = [
    ...chatLive({
      state: view,
      bot,
      approvals,
    }, chatMessages({
      entries: [...older, ...view.entries],
      bot,
      bots,
    })),
    ...chatOutgoingMessages(outgoing, {
      botId: bot.id,
      latestEntryId: view.latestEntryId,
      queued,
    }),
  ];

  const replyTo = messages.find((message) => replyToEntryId !== undefined && message.metadata?.entryId === replyToEntryId) ?? null;

  const reactionsByEntry = useChatReactions({
    botId: bot.id,
    conversationId,
    entryIds: chatEntryIds(messages),
    revision: view.interactionsRevision,
  });

  const reaction = useChatReaction(bot.id);
  const groups = (message: ChatMessageItem) => roomsReactionGroups({ reaction: reactionsByEntry.get(message.metadata?.entryId ?? 0), bots });
  const unread = useChatUnread(session, bot.id, list, messages);
  const now = new Date();

  const empty = match(messages.length)
    .with(0, () => <Text className="mx-5 mt-8 text-center" tone="muted">{m.mobile_chat_empty({ name: bot.name })}</Text>)
    .otherwise(() => null);

  const canLoadOlder = view.historyCursor !== undefined && (history.hasNextPage || !history.isFetched) && !history.isFetching;

  return (
    <View className="flex-1">
      <MessageList
        composerInset={contentInsetEndAdjustment}
        data={messages}
        footer={(
          <ChatRuns
            activity={activity}
            approvals={approvals}
            bot={bot}
            draft={messages.find((message) => message.id === CHAT.liveMessageId)}
            failure={chatFailure(view)}
            questions={questions}
            session={session}
          />
        )}
        header={empty}
        keyExtractor={(message) => message.id}
        ref={list}
        renderItem={(message) => (
          <ChatMessage
            bot={bot}
            bots={bots}
            bubble={bubble}
            isLive={message.id === CHAT.liveMessageId}
            isSending={message.id.startsWith(CHAT.outgoingPrefix)}
            message={message}
            reacting={reaction.isPending}
            reactionFailed={reaction.isError}
            reactions={groups(message)}
            session={session}
            time={message.metadata
              ? roomsTimeLabel({
                createdAt: message.metadata.createdAt,
                previous: messages[messages.indexOf(message) - 1]?.metadata?.createdAt,
                now,
                locale: getLocale(),
              })
              : undefined}
            onLongPress={() => router.push({
              pathname: '/chat/[botId]/message',
              params: {
                botId: bot.id,
                conversationId,
                entryId: message.metadata?.entryId ?? 0,
                from: message.role === 'user' ? 'user' : 'assistant',
                text: roomsMessageText(message),
                details: chatMessageDetails(message).join('\n'),
              },
            })}
            onReact={(emoji) => reaction.react({
              entryId: message.metadata?.entryId ?? 0,
              emoji,
              groups: groups(message),
            })}
          />
        )}
        onStartReached={() => {
          if (canLoadOlder) {
            void history.fetchNextPage();
          }
        }}
      />
      <ChatHeader activity={activity} bot={bot} />
      <KeyboardSticky>
        <ChatComposer
          bot={bot}
          bots={bots}
          conversationId={conversationId}
          isBusy={view.live.run !== undefined || queued.length > 0}
          latestEntryId={view.latestEntryId}
          prefill={prefill}
          queued={queued}
          quote={quote}
          replyTo={replyTo}
          session={session}
          unread={unread.count}
          onLayout={onComposerLayout}
          onOutgoingChange={setOutgoing}
          onReplyClear={() => router.setParams({ replyToEntryId: undefined })}
          onSend={() => void list.current?.scrollToEnd({ animated: true })}
          onUnreadPress={unread.seeAll}
        />
      </KeyboardSticky>
    </View>
  );
}
