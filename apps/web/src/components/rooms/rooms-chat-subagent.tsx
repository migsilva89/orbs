import { m } from '@openbots/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { match } from 'ts-pattern';
import { RoomsSubagentDialog } from '@/components/rooms/rooms-subagent-dialog';
import { Question, QuestionDescription, QuestionHeader, QuestionHeading, QuestionIcon, QuestionItem, QuestionList, QuestionTitle } from '@/components/ui/ai/question';
import { Button } from '@/components/ui/button';
import { chatContextsWatchOptions } from '@/services/chat/chat.client';
import { rpc } from '@/services/rpc/rpc.client';
import { toolRunning } from '@/services/tool/tool.client';
import IconLucideCheck from '~icons/lucide/check';
import IconLucideLoaderCircle from '~icons/lucide/loader-circle';
import IconLucideSquare from '~icons/lucide/square';
import IconLucideWorkflow from '~icons/lucide/workflow';
import IconLucideX from '~icons/lucide/x';
import type { ToolBot, ToolSubagent } from '@/types/tool.types';
import type { DynamicToolUIPart } from 'ai';

interface RoomsChatSubagentProps {
  botId: string
  bot: ToolBot
  part: DynamicToolUIPart
  subagent: ToolSubagent
}

export function RoomsChatSubagent({ botId, bot, part, subagent }: RoomsChatSubagentProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const isBackground = subagent.operation !== 'run';
  const watch = useQuery({ ...chatContextsWatchOptions({ botId }), enabled: isBackground });
  const contexts = useQuery({ ...rpc.conversation.contexts.queryOptions({ input: { botId, kind: 'subagent' } }), enabled: isBackground });
  const stop = useMutation(rpc.conversation.stop.mutationOptions());
  const context = contexts.data?.items.find((item) => item.conversationId === subagent.conversationId);
  const isRunning = isBackground ? context?.isRunning ?? toolRunning(part) : toolRunning(part);
  const revision = watch.data?.revision;

  useEffect(() => {
    if (revision !== undefined) {
      void queryClient.invalidateQueries({ queryKey: rpc.conversation.contexts.key({ input: { botId } }) });
    }
  }, [botId, queryClient, revision]);

  const icon = match({ isFailed: part.state === 'output-error', isRunning })
    .with({ isFailed: true }, () => <IconLucideX className="text-destructive" />)
    .with({ isRunning: true }, () => <IconLucideLoaderCircle className="animate-spin motion-reduce:animate-none" />)
    .otherwise(() => <IconLucideCheck />);

  return (
    <Question className="w-md max-w-full">
      <QuestionHeader>
        <QuestionIcon>
          <IconLucideWorkflow />
        </QuestionIcon>
        <QuestionHeading>
          <QuestionTitle>{subagent.name ?? m.rooms_subagents_title()}</QuestionTitle>
          <QuestionDescription>{isRunning ? m.rooms_subagents_status_running() : m.rooms_subagents_status_completed()}</QuestionDescription>
        </QuestionHeading>
      </QuestionHeader>
      <QuestionList>
        <QuestionItem
          action={isRunning && subagent.conversationId ? (
            <Button
              aria-label={m.rooms_subagents_stop()}
              disabled={stop.isPending}
              size="icon-xs"
              title={m.rooms_subagents_stop()}
              variant="quiet"
              onClick={() => stop.mutate({ botId, conversationId: subagent.conversationId })}
            >
              <IconLucideSquare />
            </Button>
          ) : undefined}
          icon={icon}
          onClick={subagent.conversationId ? () => setIsOpen(true) : undefined}
        >
          {subagent.message}
        </QuestionItem>
      </QuestionList>
      {stop.isError ? <p className="px-1 text-xs text-destructive" role="alert">{m.rooms_subagents_stop_error()}</p> : null}
      {isOpen && subagent.conversationId ? (
        <RoomsSubagentDialog
          bot={bot}
          botId={botId}
          conversationId={subagent.conversationId}
          name={subagent.name ?? m.rooms_subagents_title()}
          task={subagent.message}
          onOpenChange={setIsOpen}
        />
      ) : null}
    </Question>
  );
}
