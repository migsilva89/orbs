import { useChatQueue } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { CornerUpRight, ListOrdered } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PromptDrawerHeader, PromptDrawerItem, PromptDrawerList } from '@/components/ui/prompt-drawer';
import type { ChatQueued } from '@openbots/client/client';

interface ChatQueueProps {
  botId: string;
  botName: string;
  conversationId: number;
  queued: ChatQueued[];
}

export function ChatQueue({ botId, botName, conversationId, queued }: ChatQueueProps) {
  const queue = useChatQueue({ botId, conversationId });

  if (queued.length === 0) {
    return null;
  }

  return (
    <>
      <PromptDrawerHeader icon={ListOrdered}>{m.rooms_chat_queue()}</PromptDrawerHeader>
      <PromptDrawerList>
        {queued.map((item) => {
          const isFailed = queue.isFailed(item.submissionId);

          return (
            <PromptDrawerItem
              key={item.submissionId}
              title={isFailed ? m.rooms_chat_queue_steer_failed() : item.text}
              tone={isFailed ? 'destructive' : 'default'}
              trailing={item.mode === 'followUp' ? (
                <Button
                  accessibilityHint={m.rooms_chat_queue_steer_hint({ bot: botName })}
                  disabled={queue.isPending}
                  size="xs"
                  variant="ghost"
                  onPress={() => queue.steer(item.submissionId)}
                >
                  <Icon icon={CornerUpRight} size="sm" />
                  {m.rooms_chat_queue_steer()}
                </Button>
              ) : null}
            />
          );
        })}
      </PromptDrawerList>
    </>
  );
}
