import { chatLive, chatMessages, roomsMessageText } from '@repo/client/client';
import { chatQueries } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { Message, MessageContent, MessageStack } from '@repo/ui/ai/message';
import { Response } from '@repo/ui/ai/response';
import { BotAvatar } from '@repo/ui/bots/bot-avatar';
import { Clamp } from '@repo/ui/clamp';
import { Pane, PaneBody, PaneContent, PaneHeader, PaneTitle } from '@repo/ui/pane';
import { RoomsChatApproval } from '@repo/ui/rooms/rooms-chat-approval';
import { RoomsChatQuestions } from '@repo/ui/rooms/rooms-chat-questions';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { rpc } from '@/services/rpc/rpc.client';
import { RPC_CONTEXT } from '@/services/rpc/rpc.constants';
import type { ToolBot } from '@repo/client/client';

interface RoomsSubagentPaneProps {
  botId: string
  bot: ToolBot
  conversationId: number
  name: string
  task: string
  onOpenChange: (open: boolean) => void
}

export function RoomsSubagentPane({ botId, bot, conversationId, name, task, onOpenChange }: RoomsSubagentPaneProps) {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const { data: view } = useQuery(chatQueries.view(RPC_CONTEXT, { botId, conversationId }));
  const { data: pending = [] } = useQuery(rpc.tools.pending.queryOptions({ input: { botId } }));
  const { data: questions = [] } = useQuery(rpc.conversation.questions.queryOptions({ input: { botId, conversationId } }));
  const approvals = pending.filter((approval) => approval.conversationId === conversationId);
  const owner = bots.find((item) => item.id === botId);

  const messages = view && owner ? chatLive({
    state: view,
    bot: owner,
    approvals: [],
  }, chatMessages({
    entries: view.entries,
    bot: owner,
    bots,
  })) : [];

  const replies = messages.filter((message) => message.role === 'assistant' && roomsMessageText(message));

  return (
    <Pane open onOpenChange={onOpenChange}>
      <PaneContent>
        <PaneHeader>
          <PaneTitle>{name}</PaneTitle>
        </PaneHeader>
        <PaneBody>
          <div className="mb-4 text-xs text-muted-foreground">
            <Clamp size="sm">{task}</Clamp>
          </div>
          {replies.map((message) => (
            <Message from="assistant" key={message.id}>
              <MessageStack>
                <MessageContent>
                  <Response renderHtml isAnimating={message.parts.some((part) => part.type === 'text' && part.state === 'streaming')}>{roomsMessageText(message)}</Response>
                </MessageContent>
              </MessageStack>
              <BotAvatar
                animate={view?.live.run !== undefined}
                bot={{ avatar: bot.avatar, name }}
              />
            </Message>
          ))}
          {questions.map((question) => (
            <RoomsChatQuestions
              className="my-2"
              key={question.id}
              question={question}
            />
          ))}
          {approvals.map((approval) => (
            <RoomsChatApproval
              approval={approval}
              botName={name}
              className="my-2"
              key={approval.id}
            />
          ))}
          {view && replies.length === 0 && approvals.length === 0 && questions.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">{m.rooms_subagent_empty()}</p> : null}
        </PaneBody>
      </PaneContent>
    </Pane>
  );
}
