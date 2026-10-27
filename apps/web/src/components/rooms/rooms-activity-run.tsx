import { m } from '@repo/i18n/client';
import { getLocale } from '@repo/i18n/runtime';
import { agentTimelineCost, agentTimelineSeconds } from '@repo/ui/agent-timeline.utils';
import { cn } from '@repo/ui/cn';
import { Link, useHydrated } from '@tanstack/react-router';
import { match } from 'ts-pattern';
import { RoomsActivityTimeline } from '@/components/rooms/rooms-activity-timeline';
import IconActivity from '~icons/lucide/activity';
import IconAlarmClock from '~icons/lucide/alarm-clock';
import IconBot from '~icons/lucide/bot';
import IconChevronRight from '~icons/lucide/chevron-right';
import IconCircleX from '~icons/lucide/circle-x';
import IconMessageSquare from '~icons/lucide/message-square';
import IconSmile from '~icons/lucide/smile';
import IconUsers from '~icons/lucide/users';
import type { ActivityRunSummary, Bot } from '@repo/contracts/universal';

interface RoomsActivityRunProps {
  bot: Bot
  run: ActivityRunSummary
  isOpen: boolean
}

export function RoomsActivityRun({ bot, run, isOpen }: RoomsActivityRunProps) {
  const hydrated = useHydrated();
  const date = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' });

  const triggerIcon = match(run.trigger)
    .with('message', () => <IconMessageSquare />)
    .with('routine', () => <IconAlarmClock />)
    .with('reaction', () => <IconSmile />)
    .with('subagent', () => <IconBot />)
    .with('peer', () => <IconUsers />)
    .with('other', () => <IconActivity />)
    .exhaustive();

  const trigger = match(run.trigger)
    .with('message', () => m.rooms_activity_trigger_message())
    .with('routine', () => m.rooms_activity_trigger_routine())
    .with('reaction', () => m.rooms_activity_trigger_reaction())
    .with('subagent', () => m.rooms_activity_trigger_subagent())
    .with('peer', () => m.rooms_activity_trigger_peer())
    .with('other', () => m.rooms_activity_trigger_other())
    .exhaustive();

  const meta = [
    agentTimelineSeconds(run.durationMs / 1000),
    run.agentCount === 1 ? m.rooms_activity_agent() : m.rooms_activity_agents({ count: run.agentCount }),
    run.toolCallCount === 1 ? m.rooms_activity_tool() : m.rooms_activity_tools({ count: run.toolCallCount }),
    agentTimelineCost(run.cost),
  ];

  return (
    <li>
      <Link
        aria-expanded={isOpen}
        className="group flex w-full min-w-0 items-start gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
        params={{ handle: bot.handle, runId: run.id }}
        resetScroll={false}
        title={m.rooms_activity_expand()}
        to={isOpen ? '/rooms/direct/$handle/activity' : '/rooms/direct/$handle/activity/$runId'}
      >
        <span className="flex h-5 flex-none items-center">
          <IconChevronRight
            aria-hidden
            className={cn('size-4 text-muted-foreground transition-transform group-hover:text-foreground', isOpen && 'rotate-90 text-foreground')}
          />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex h-5 min-w-0 items-center gap-3">
            <span className="min-w-0 flex-1 truncate text-sm text-foreground/90 group-hover:text-foreground">{run.title ?? trigger}</span>
            {run.isLive ? (
              <span className="flex flex-none items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 animate-pulse rounded-full bg-success motion-reduce:animate-none" />
                {m.rooms_activity_live()}
              </span>
            ) : null}
            {run.isFailed && !run.isLive ? (
              <span className="flex flex-none items-center gap-1.5 text-xs text-muted-foreground">
                <IconCircleX aria-hidden className="size-3.5 text-destructive" />
                {m.rooms_activity_failed()}
              </span>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span aria-hidden className="inline-grid size-3 *:size-full">{triggerIcon}</span>
              {trigger}
            </span>
            <span aria-hidden>·</span>
            <span>{hydrated ? date.format(new Date(run.startedAt)) : ''}</span>
            {meta.map((part) => (
              <span className="contents" key={part}>
                <span aria-hidden>·</span>
                <span className="tabular-nums">{part}</span>
              </span>
            ))}
          </div>
        </div>
      </Link>
      {isOpen ? (
        <div className="pt-3 pb-4 pl-8.5">
          <RoomsActivityTimeline
            bot={bot}
            run={run}
            title={run.title ?? trigger}
          />
        </div>
      ) : null}
    </li>
  );
}
