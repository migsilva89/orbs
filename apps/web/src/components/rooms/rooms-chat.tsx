import { CHAT, chatActivity, chatEntryIds, chatFailure, chatLive, chatMessages, chatOutgoingMessages, chatQueued, mentionQuote } from '@openbots/client/client';
import { chatHistoryOptions, chatViewOptions, useChatReactions } from '@openbots/client/react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { RoomsChatAround } from '@/components/rooms/rooms-chat-around';
import { RoomsChatComposer } from '@/components/rooms/rooms-chat-composer';
import { RoomsChatPill } from '@/components/rooms/rooms-chat-pill';
import { RoomsChatQuote } from '@/components/rooms/rooms-chat-quote';
import { RoomsChatRuns } from '@/components/rooms/rooms-chat-runs';
import { RoomsChatTranscript } from '@/components/rooms/rooms-chat-transcript';
import { useChatQuote } from '@/hooks/use-chat-quote';
import { useRoomRead } from '@/hooks/use-room-read';
import { LAYOUT_SHORTCUT_OPTIONS, LAYOUT_SHORTCUT_OVERLAYS, LAYOUT_SHORTCUTS } from '@/services/layout/layout.constants';
import { rpc } from '@/services/rpc/rpc.client';
import { RPC_CONTEXT } from '@/services/rpc/rpc.constants';
import type { PromptInputEditorHandle } from '@/components/ui/ai/prompt-input-editor';
import type { ChatMessage, ChatOutgoing, RoomsChat as RoomsChatItem } from '@openbots/client/client';
import type { Bot, ConversationView } from '@openbots/contracts/universal';

interface RoomsChatViewProps {
  bot: Bot
  bots: Bot[]
  chat: RoomsChatItem
  view: ConversationView
}

function RoomsChatView({ bot, bots, chat, view }: RoomsChatViewProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message: focusEntryId } = useSearch({ from: '/_chat' });
  const composer = useRef<PromptInputEditorHandle>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [outgoing, setOutgoing] = useState<ChatOutgoing[]>([]);
  const quote = useChatQuote();
  const { conversationId } = view;

  const history = useInfiniteQuery(chatHistoryOptions(RPC_CONTEXT, {
    botId: bot.id,
    conversationId,
    cursor: view.historyCursor,
  }));

  const { data: pending = [] } = useQuery(rpc.tools.pending.queryOptions({ input: { botId: bot.id } }));
  const { data: questions = [] } = useQuery(rpc.conversation.questions.queryOptions({ input: { botId: bot.id, conversationId } }));
  const approvals = pending.filter((approval) => approval.conversationId === conversationId);
  const older = [...(history.data?.pages.flatMap((page) => page.items) ?? [])].reverse();

  const messages = chatLive({
    state: view,
    bot,
    approvals,
  }, chatMessages({
    entries: [...older, ...view.entries],
    bot,
    bots,
  }));

  const reactions = useChatReactions({
    botId: bot.id,
    conversationId,
    entryIds: chatEntryIds(messages),
    revision: view.interactionsRevision,
  });

  const unread = useRoomRead(bot.id, chat.readThroughEntryId, view.latestEntryId);
  const activity = chatActivity(view);
  const queued = chatQueued(view);

  const sending = chatOutgoingMessages(outgoing, {
    botId: bot.id,
    latestEntryId: view.latestEntryId,
    queued,
  });

  const isBusy = view.live.run !== undefined || queued.length > 0;
  const around = focusEntryId !== undefined && !messages.some((message) => message.metadata?.entryIds.includes(focusEntryId)) ? focusEntryId : undefined;

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: rpc.artifacts.key({ input: { botId: bot.id } }) });
  }, [bot.id, queryClient, view.artifactsRevision]);

  function quoteSelection() {
    const entryId = messages.find((message) => message.id === quote.selection?.messageId)?.metadata?.entryId;

    if (!quote.selection || entryId === undefined) {
      return;
    }

    composer.current?.insert([mentionQuote({ text: quote.selection.text, entryId })]);
    document.getSelection()?.removeAllRanges();
    quote.dismiss();
  }

  function leaveFocus() {
    void navigate({
      to: '.',
      search: (previous) => ({ ...previous, message: undefined }),
      replace: true,
    });
  }

  useHotkeys(LAYOUT_SHORTCUTS.stop, () => void rpc.conversation.stop.call({ botId: bot.id, conversationId }), {
    ...LAYOUT_SHORTCUT_OPTIONS,
    enabled: isBusy,
    ignoreEventWhen: () => Boolean(document.querySelector(LAYOUT_SHORTCUT_OVERLAYS)),
  });

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-12 pt-3 *:pointer-events-auto">
        <RoomsChatPill activity={activity} bot={bot} />
      </div>
      {around ? (
        <RoomsChatAround
          bot={bot}
          bots={bots}
          entryId={around}
          key={around}
          view={view}
          onLatest={leaveFocus}
          onReply={setReplyTo}
        />
      ) : (
        <RoomsChatTranscript
          bot={bot}
          bots={bots}
          focusedEntryId={focusEntryId}
          footer={(
            <RoomsChatRuns
              activity={activity}
              approvals={approvals}
              bot={bot}
              draft={messages.find((message) => message.id === CHAT.liveMessageId)}
              failure={chatFailure(view)}
              questions={questions}
            />
          )}
          messages={[...messages, ...sending]}
          older={{
            isEnabled: view.historyCursor !== undefined && (history.hasNextPage || !history.isFetched),
            isLoading: history.isFetching,
            onLoad: () => void history.fetchNextPage(),
          }}
          reactions={reactions}
          unread={chat.hasUnread || unread.throughEntryId < view.latestEntryId ? unread : undefined}
          onReply={setReplyTo}
        />
      )}
      {quote.selection ? (
        <RoomsChatQuote
          rect={quote.selection.rect}
          onDismiss={quote.dismiss}
          onQuote={quoteSelection}
        />
      ) : null}
      <RoomsChatComposer
        bot={bot}
        bots={bots}
        conversationId={conversationId}
        editor={composer}
        isBusy={isBusy}
        isCompacting={activity === 'compacting'}
        latestEntryId={view.latestEntryId}
        messages={messages}
        queued={queued}
        replyTo={replyTo}
        onOutgoingChange={setOutgoing}
        onReplyChange={setReplyTo}
        onSend={focusEntryId ? leaveFocus : undefined}
      />
    </div>
  );
}

interface RoomsChatProps {
  bot: Bot
  bots: Bot[]
  chat: RoomsChatItem
}

export function RoomsChat({ bot, bots, chat }: RoomsChatProps) {
  const { data: view } = useQuery(chatViewOptions(RPC_CONTEXT, { botId: bot.id }));

  return view ? (
    <RoomsChatView
      bot={bot}
      bots={bots}
      chat={chat}
      view={view}
    />
  ) : null;
}
