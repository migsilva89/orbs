import { chatPrivateSource } from '@repo/client/client';
import { Fragment } from 'react';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { RoomsChatActivity } from '@/components/rooms/rooms-chat-activity';
import { RoomsChatApproval } from '@/components/rooms/rooms-chat-approval';
import { RoomsChatFailure } from '@/components/rooms/rooms-chat-failure';
import { RoomsChatQuestions } from '@/components/rooms/rooms-chat-questions';
import { MessageScrollerItem } from '@/components/ui/message-scroller';
import type { ChatActivity, ChatMessage } from '@repo/client/client';
import type { Bot, ConversationQuestion, ToolApproval } from '@repo/contracts/universal';

interface RoomsChatRunsProps {
  bot: Bot
  bots?: Bot[]
  activity: ChatActivity
  failure: string | null
  draft?: ChatMessage
  approvals: ToolApproval[]
  questions: ConversationQuestion[]
}

export function RoomsChatRuns({ bot, bots = [], activity, failure, draft, approvals, questions }: RoomsChatRunsProps) {
  const source = (privateWith: string | null) => {
    const label = chatPrivateSource({ privateWith, bots });

    return label ? <p className="mt-2 text-xs text-muted-foreground">{label}</p> : null;
  };

  return (
    <MessageScrollerItem>
      {questions.map((question) => (
        <Fragment key={question.id}>
          {source(question.privateWith)}
          <RoomsChatQuestions className="my-2" question={question} />
        </Fragment>
      ))}
      {approvals.map((approval) => (
        <Fragment key={approval.id}>
          {source(approval.privateWith)}
          <RoomsChatApproval
            approval={approval}
            botName={bot.name}
            className="my-2"
          />
        </Fragment>
      ))}
      {failure ? (
        <div className="flex items-center gap-2 py-2">
          <BotAvatar
            activity="failed"
            bot={bot}
            size={24}
          />
          <RoomsChatFailure botName={bot.name} detail={failure} />
        </div>
      ) : null}
      <div className="flex h-8 items-center">
        {activity === 'idle' || activity === 'failed' ? null : (
          <RoomsChatActivity
            activity={activity}
            botName={bot.name}
            draft={draft}
            waiting={activity === 'queued'}
          />
        )}
      </div>
    </MessageScrollerItem>
  );
}
