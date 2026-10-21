import { BotAvatar } from '@/components/bots/bot-avatar';
import { RoomsChatActivity } from '@/components/rooms/rooms-chat-activity';
import { RoomsChatApproval } from '@/components/rooms/rooms-chat-approval';
import { RoomsChatFailure } from '@/components/rooms/rooms-chat-failure';
import { RoomsChatQuestions } from '@/components/rooms/rooms-chat-questions';
import { MessageScrollerItem } from '@/components/ui/message-scroller';
import type { ChatActivity, ChatMessage } from '@openbots/client/client';
import type { Bot, ConversationQuestion, ToolApproval } from '@openbots/contracts/universal';

interface RoomsChatRunsProps {
  bot: Bot
  activity: ChatActivity
  failure: string | null
  draft?: ChatMessage
  approvals: ToolApproval[]
  questions: ConversationQuestion[]
}

export function RoomsChatRuns({ bot, activity, failure, draft, approvals, questions }: RoomsChatRunsProps) {
  return (
    <MessageScrollerItem>
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
          botName={bot.name}
          className="my-2"
          key={approval.id}
        />
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
      {activity === 'idle' || activity === 'failed' ? null : (
        <RoomsChatActivity
          activity={activity}
          bot={bot}
          botName={bot.name}
          draft={draft}
          waiting={activity === 'queued'}
        />
      )}
    </MessageScrollerItem>
  );
}
