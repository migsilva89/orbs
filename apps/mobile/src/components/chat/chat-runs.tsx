import { BOT_ACTIVITY_LABELS, chatPrivateSource, toolRunning } from '@repo/client/client';
import { useChatHideVerbose } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { Fragment } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ChatApproval } from './chat-approval';
import { ChatFailure } from './chat-failure';
import { ChatQuestion } from './chat-question';
import { ChatTyping } from './chat-typing';
import type { ChatActivity, ChatMessage } from '@repo/client/client';
import type { Bot, ConversationQuestion, ToolApproval } from '@repo/contracts/universal';

interface ChatRunsProps {
  bot: Bot;
  bots?: Bot[];
  activity: ChatActivity;
  failure: string | null;
  draft?: ChatMessage;
  approvals: ToolApproval[];
  questions: ConversationQuestion[];
}

export function ChatRuns({ bot, bots = [], activity, failure, draft, approvals, questions }: ChatRunsProps) {
  const source = (privateWith: string | null) => {
    const label = chatPrivateSource({ privateWith, bots });

    return label ? (
      <Text
        className="mx-4 mt-2"
        tone="muted"
        variant="caption"
      >
        {label}
      </Text>
    ) : null;
  };

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
        <Fragment key={question.id}>
          {source(question.privateWith)}
          <ChatQuestion question={question} />
        </Fragment>
      ))}
      {approvals.map((approval) => (
        <Fragment key={approval.id}>
          {source(approval.privateWith)}
          <ChatApproval approval={approval} botName={bot.name} />
        </Fragment>
      ))}
      {failure ? <ChatFailure botName={bot.name} detail={failure} /> : null}
      <View className="h-7 justify-center">
        {isActive ? <ChatTyping accessibilityLabel={label} label={activity === 'thinking' ? undefined : label} /> : null}
      </View>
    </View>
  );
}
