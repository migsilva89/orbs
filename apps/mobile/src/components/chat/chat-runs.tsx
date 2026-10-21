import { BOT_ACTIVITY_LABELS, toolRunning } from '@openbots/client/client';
import { useChatHideVerbose } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { View } from 'react-native';
import { ChatApproval } from './chat-approval';
import { ChatFailure } from './chat-failure';
import { ChatQuestion } from './chat-question';
import { ChatTyping } from './chat-typing';
import type { ChatActivity, ChatMessage } from '@openbots/client/client';
import type { Bot, ConversationQuestion, ToolApproval } from '@openbots/contracts/universal';

interface ChatRunsProps {
  bot: Bot;
  activity: ChatActivity;
  failure: string | null;
  draft?: ChatMessage;
  approvals: ToolApproval[];
  questions: ConversationQuestion[];
}

export function ChatRuns({ bot, activity, failure, draft, approvals, questions }: ChatRunsProps) {
  const { hideVerbose } = useChatHideVerbose();
  const last = draft?.parts.filter((part) => part.type !== 'step-start').at(-1);
  const isWaiting = activity === 'queued';

  const isSpeaking = (activity === 'writing' && last?.type === 'text' && last.state === 'streaming')
    || (!isWaiting && !hideVerbose && last?.type === 'dynamic-tool' && toolRunning(last))
    || (!isWaiting && !hideVerbose && last?.type === 'reasoning' && last.state === 'streaming');

  const isActive = activity !== 'idle' && activity !== 'failed' && !isSpeaking;

  const label = isWaiting ? m.rooms_chat_waiting({ bot: bot.name }) : BOT_ACTIVITY_LABELS[activity]();

  return (
    <View>
      {questions.map((question) => (
        <ChatQuestion
          key={question.id}
          question={question}
        />
      ))}
      {approvals.map((approval) => (
        <ChatApproval
          approval={approval}
          botName={bot.name}
          key={approval.id}
        />
      ))}
      {failure ? <ChatFailure botName={bot.name} detail={failure} /> : null}
      <View className="h-7 justify-center">
        {isActive ? <ChatTyping accessibilityLabel={label} label={activity === 'thinking' ? undefined : label} /> : null}
      </View>
    </View>
  );
}
