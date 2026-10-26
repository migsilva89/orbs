import { chatLive, chatMessages, roomsMessageText } from '@repo/client/client';
import { chatQueries } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { RoomsChatApproval } from '@/components/rooms/rooms-chat-approval';
import { RoomsChatQuestions } from '@/components/rooms/rooms-chat-questions';
import { Message, MessageContent, MessageStack } from '@/components/ui/ai/message';
import { Response } from '@/components/ui/ai/response';
import { Clamp } from '@/components/ui/clamp';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { rpc } from '@/services/rpc/rpc.client';
import { RPC_CONTEXT } from '@/services/rpc/rpc.constants';
import type { ToolBot } from '@repo/client/client';

interface RoomsSubagentDialogProps {
  botId: string
  bot: ToolBot
  conversationId: number
  name: string
  task: string
  onOpenChange: (open: boolean) => void
}

export function RoomsSubagentDialog({ botId, bot, conversationId, name, task, onOpenChange }: RoomsSubagentDialogProps) {
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
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85svh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription asChild>
            <div>
              <Clamp size="sm">{task}</Clamp>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-6 scrollbar min-h-0 flex-1 overflow-y-auto px-6 [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
