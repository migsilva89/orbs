import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { RoomsChatAround } from '@/components/rooms/rooms-chat-around';
import { RoomsChatComposer } from '@/components/rooms/rooms-chat-composer';
import { RoomsChatPill } from '@/components/rooms/rooms-chat-pill';
import { RoomsChatRuns } from '@/components/rooms/rooms-chat-runs';
import { RoomsChatTranscript } from '@/components/rooms/rooms-chat-transcript';
import { useRoomReactions } from '@/hooks/use-room-reactions';
import { useRoomRead } from '@/hooks/use-room-read';
import { chatHistoryOptions, chatViewOptions } from '@/services/chat/chat.client';
import { CHAT } from '@/services/chat/chat.constants';
import { chatActivity, chatFailure, chatLive, chatMessages, chatQueued } from '@/services/chat/chat.utils';
import { LAYOUT_SHORTCUT_OPTIONS, LAYOUT_SHORTCUT_OVERLAYS, LAYOUT_SHORTCUTS } from '@/services/layout/layout.constants';
import { rpc } from '@/services/rpc/rpc.client';
import type { PromptInputEditorHandle } from '@/components/ui/ai/prompt-input-editor';
import type { ChatMessage } from '@/types/chat.types';
import type { RoomsChat as RoomsChatItem } from '@/types/rooms.types';
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
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const { conversationId } = view;

  const history = useInfiniteQuery(chatHistoryOptions({
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

  const reactions = useRoomReactions(bot.id, conversationId, messages, view.interactionsRevision);
  const unread = useRoomRead(bot.id, chat.readThroughEntryId, view.latestEntryId);
  const activity = chatActivity(view);
  const queued = chatQueued(view);
  const isBusy = view.live.run !== undefined || queued.length > 0;
  const around = focusEntryId !== undefined && !messages.some((message) => message.metadata?.entryIds.includes(focusEntryId)) ? focusEntryId : undefined;

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: rpc.artifacts.key({ input: { botId: bot.id } }) });
  }, [bot.id, queryClient, view.artifactsRevision]);

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
          messages={messages}
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
      <RoomsChatComposer
        bot={bot}
        conversationId={conversationId}
        editor={composer}
        isBusy={isBusy}
        isCompacting={activity === 'compacting'}
        messages={messages}
        queued={queued}
        replyTo={replyTo}
        text={text}
        onReplyChange={setReplyTo}
        onSend={focusEntryId ? leaveFocus : undefined}
        onTextChange={setText}
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
  const { data: view } = useQuery(chatViewOptions({ botId: bot.id }));

  return view ? (
    <RoomsChatView
      bot={bot}
      bots={bots}
      chat={chat}
      view={view}
    />
  ) : null;
}
