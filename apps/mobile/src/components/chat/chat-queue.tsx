import { m } from '@openbots/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { CornerUpRight, ListOrdered } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PromptDrawerHeader, PromptDrawerItem, PromptDrawerList } from '@/components/ui/prompt-drawer';
import type { RpcSession } from '@/types/rpc.types';
import type { ChatQueued } from '@openbots/client/client';

interface ChatQueueProps {
  session: RpcSession;
  botId: string;
  botName: string;
  conversationId: number;
  queued: ChatQueued[];
}

export function ChatQueue({ session, botId, botName, conversationId, queued }: ChatQueueProps) {
  const promote = useMutation(session.rpc.conversation.updateSubmission.mutationOptions());

  if (queued.length === 0) {
    return null;
  }

  return (
    <>
      <PromptDrawerHeader icon={ListOrdered}>{m.rooms_chat_queue()}</PromptDrawerHeader>
      <PromptDrawerList>
        {queued.map((item) => {
          const isFailed = promote.isError && promote.variables.submissionId === item.submissionId;

          return (
            <PromptDrawerItem
              key={item.submissionId}
              title={isFailed ? m.rooms_chat_queue_steer_failed() : item.text}
              tone={isFailed ? 'destructive' : 'default'}
              trailing={item.mode === 'followUp' ? (
                <Button
                  accessibilityHint={m.rooms_chat_queue_steer_hint({ bot: botName })}
                  disabled={promote.isPending}
                  size="xs"
                  variant="ghost"
                  onPress={() => promote.mutate({
                    botId,
                    conversationId,
                    submissionId: item.submissionId,
                    whenBusy: 'steer',
                  })}
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
