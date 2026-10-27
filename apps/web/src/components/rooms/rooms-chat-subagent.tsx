import { useChatSubagent } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { RoomsSubagentPane } from '@/components/rooms/rooms-subagent-pane';
import { Question, QuestionDescription, QuestionHeader, QuestionHeading, QuestionIcon, QuestionItem, QuestionList, QuestionTitle } from '@/components/ui/ai/question';
import { Button } from '@/components/ui/button';
import IconLucideCheck from '~icons/lucide/check';
import IconLucideLoaderCircle from '~icons/lucide/loader-circle';
import IconLucideSquare from '~icons/lucide/square';
import IconLucideWorkflow from '~icons/lucide/workflow';
import IconLucideX from '~icons/lucide/x';
import type { ToolBot, ToolSubagent } from '@repo/client/client';
import type { DynamicToolUIPart } from 'ai';

interface RoomsChatSubagentProps {
  botId: string
  bot: ToolBot
  part: DynamicToolUIPart
  subagent: ToolSubagent
}

export function RoomsChatSubagent({ botId, bot, part, subagent }: RoomsChatSubagentProps) {
  const [isOpen, setIsOpen] = useState(false);

  const live = useChatSubagent({
    botId,
    part,
    subagent,
  });

  const { isRunning } = live;

  const icon = match({ isFailed: live.isFailed, isRunning })
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
              disabled={live.isStopping}
              size="icon-xs"
              title={m.rooms_subagents_stop()}
              variant="quiet"
              onClick={live.stop}
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
      {live.stopFailed ? <p className="px-1 text-xs text-destructive" role="alert">{m.rooms_subagents_stop_error()}</p> : null}
      {isOpen && subagent.conversationId ? (
        <RoomsSubagentPane
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
