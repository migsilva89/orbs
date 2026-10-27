import { useChatSubagent } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { Check, ChevronRight, Square, Workflow, X } from 'lucide-react-native';
import { ActivityIndicator, Pressable } from 'react-native';
import { match } from 'ts-pattern';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { QuestionCard, QuestionCardHeader, QuestionCardOptions } from '@/components/ui/question-card';
import { Text } from '@/components/ui/text';
import type { ToolPart, ToolSubagent } from '@repo/client/client';

interface ChatSubagentProps {
  botId: string;
  part: ToolPart;
  subagent: ToolSubagent;
}

export function ChatSubagent({ botId, part, subagent }: ChatSubagentProps) {
  const router = useRouter();

  const live = useChatSubagent({
    botId,
    part,
    subagent,
  });

  const name = subagent.name ?? m.rooms_subagents_title();
  const { conversationId } = subagent;

  const status = match(live)
    .with({ isFailed: true }, () => m.rooms_subagents_status_failed())
    .with({ isRunning: true }, () => m.rooms_subagents_status_running())
    .otherwise(() => m.rooms_subagents_status_completed());

  const stop = live.isRunning && conversationId ? (
    <Button
      accessibilityLabel={m.rooms_subagents_stop()}
      disabled={live.isStopping}
      size="icon-sm"
      variant="ghost"
      onPress={live.stop}
    >
      <Icon
        icon={Square}
        size="sm"
        tone="muted"
      />
    </Button>
  ) : undefined;

  return (
    <QuestionCard>
      <QuestionCardHeader
        action={stop}
        descriptions={[status]}
        icon={Workflow}
        title={name}
      />
      <QuestionCardOptions>
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center gap-3 px-3 py-2.5 active:bg-accent"
          disabled={!conversationId}
          onPress={() => conversationId && router.push({
            pathname: '/chat/[botId]/subagent/[conversationId]',
            params: { botId, conversationId: String(conversationId), name, task: subagent.message },
          })}
        >
          {match(live)
            .with({ isFailed: true }, () => <Icon icon={X} tone="destructive" />)
            .with({ isRunning: true }, () => <ActivityIndicator size="small" />)
            .otherwise(() => <Icon icon={Check} tone="muted" />)}
          <Text
            className="flex-1"
            numberOfLines={3}
            variant="body"
          >
            {subagent.message}
          </Text>
          {conversationId ? (
            <Icon
              icon={ChevronRight}
              size="sm"
              tone="muted"
            />
          ) : null}
        </Pressable>
      </QuestionCardOptions>
      {live.stopFailed ? <Text tone="destructive" variant="small">{m.rooms_subagents_stop_error()}</Text> : null}
    </QuestionCard>
  );
}
