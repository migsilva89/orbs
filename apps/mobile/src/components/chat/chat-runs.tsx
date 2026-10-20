import { BOT_ACTIVITY_LABELS, toolRunning } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { Bot as BotIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { TraceRow } from '@/components/ui/trace';
import { ChatApproval } from './chat-approval';
import { ChatQuestion } from './chat-question';
import type { RpcSession } from '@/types/rpc.types';
import type { ChatActivity, ChatMessage } from '@openbots/client/client';
import type { Bot, ConversationQuestion, ToolApproval } from '@openbots/contracts/universal';

interface ChatRunsProps {
  session: RpcSession;
  bot: Bot;
  activity: ChatActivity;
  failure: string | null;
  draft?: ChatMessage;
  approvals: ToolApproval[];
  questions: ConversationQuestion[];
}

export function ChatRuns({ session, bot, activity, failure, draft, approvals, questions }: ChatRunsProps) {
  const last = draft?.parts.filter((part) => part.type !== 'step-start').at(-1);
  const isWaiting = activity === 'queued';

  const isSpeaking = (activity === 'writing' && last?.type === 'text' && last.state === 'streaming')
    || (!isWaiting && last?.type === 'dynamic-tool' && toolRunning(last))
    || (!isWaiting && last?.type === 'reasoning' && last.state === 'streaming');

  const isActive = activity !== 'idle' && activity !== 'failed' && !isSpeaking;

  const avatar = (
    <Avatar
      avatar={bot.avatar}
      name={bot.name}
      size="xs"
    />
  );

  return (
    <View className="pb-2">
      {questions.map((question) => (
        <ChatQuestion
          key={question.id}
          question={question}
          session={session}
        />
      ))}
      {approvals.map((approval) => (
        <ChatApproval
          approval={approval}
          botName={bot.name}
          key={approval.id}
          session={session}
        />
      ))}
      {failure ? (
        <Text
          className="mx-5 my-2"
          tone="destructive"
          variant="small"
        >
          {`${m.rooms_chat_failed({ bot: bot.name })} ${failure}`}
        </Text>
      ) : null}
      {isActive ? (
        <View className="px-3">
          <TraceRow
            avatar={avatar}
            icon={BotIcon}
            status="running"
            title={isWaiting ? m.rooms_chat_waiting({ bot: bot.name }) : m.avatars_bot_label({ bot: bot.name, activity: BOT_ACTIVITY_LABELS[activity]() })}
          />
        </View>
      ) : null}
    </View>
  );
}
