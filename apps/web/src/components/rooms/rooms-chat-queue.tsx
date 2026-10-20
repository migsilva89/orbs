import { m } from '@openbots/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { PromptInputDrawer } from '@/components/ui/ai/prompt-input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { rpc } from '@/services/rpc/rpc.client';
import IconCornerUpRight from '~icons/lucide/corner-up-right';
import IconListOrdered from '~icons/lucide/list-ordered';
import type { ChatQueued } from '@openbots/client/client';

interface RoomsChatQueueProps {
  botId: string
  botName: string
  conversationId: number
  queued: ChatQueued[]
}

export function RoomsChatQueue({ botId, botName, conversationId, queued }: RoomsChatQueueProps) {
  const promote = useMutation(rpc.conversation.updateSubmission.mutationOptions());

  if (queued.length === 0) {
    return null;
  }

  return (
    <PromptInputDrawer>
      <section aria-label={m.rooms_chat_queue()} aria-live="polite">
        <header className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
          <IconListOrdered className="size-3.5" />
          {m.rooms_chat_queue()}
        </header>
        <ol>
          {queued.map((item) => {
            const isFailed = promote.isError && promote.variables.submissionId === item.submissionId;

            return (
              <li className="flex min-w-0 items-center gap-2 rounded-lg py-0.5 pr-0.5 pl-2 text-xs" key={item.submissionId}>
                <span className={cn('min-w-0 flex-1 truncate', isFailed ? 'text-destructive' : 'text-muted-foreground')} title={item.text}>
                  {isFailed ? m.rooms_chat_queue_steer_failed() : item.text}
                </span>
                {item.mode === 'followUp' ? (
                  <Button
                    disabled={promote.isPending}
                    size="xs"
                    title={m.rooms_chat_queue_steer_hint({ bot: botName })}
                    variant="ghost"
                    onClick={() => promote.mutate({
                      botId,
                      conversationId,
                      submissionId: item.submissionId,
                      whenBusy: 'steer',
                    })}
                  >
                    <IconCornerUpRight />
                    {m.rooms_chat_queue_steer()}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>
    </PromptInputDrawer>
  );
}
