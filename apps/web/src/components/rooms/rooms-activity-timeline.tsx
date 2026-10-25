import { botModelBrand, toolPresentation, toolPreview } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { match, P } from 'ts-pattern';
import { BotBrandLogo } from '@/components/bots/bot-brand-logo';
import { ToolIcon } from '@/components/tools/tool-icon';
import { AgentTimeline } from '@/components/ui/agent-timeline';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { rpc } from '@/services/rpc/rpc.client';
import type { AgentTimelineRun } from '@/types/agent-timeline.types';
import type * as UniversalTypes from '@repo/contracts/universal';

interface RoomsActivityTimelineProps {
  bot: UniversalTypes.Bot
  run: UniversalTypes.ActivityRunSummary
  title: string
}

export function RoomsActivityTimeline({ bot, run, title }: RoomsActivityTimelineProps) {
  const [wasLive, setWasLive] = useState(run.isLive);
  const [settledAt, setSettledAt] = useState<number | null>(null);

  const detail = useQuery({
    ...rpc.activity.run.queryOptions({ input: { botId: bot.id, runId: run.id } }),
    refetchInterval: (query) => match({ isLive: query.state.data?.isLive ?? run.isLive, isSettling: query.state.dataUpdatedAt === settledAt })
      .with({ isLive: true }, () => 1000)
      .with({ isSettling: true }, () => 1500)
      .otherwise(() => false),
  });

  const isLive = detail.data?.isLive ?? run.isLive;

  if (wasLive !== isLive) {
    setWasLive(isLive);
    setSettledAt(isLive ? null : detail.dataUpdatedAt);
  }

  const label = (span: UniversalTypes.ActivitySpan) => match(span)
    .with({ kind: 'thinking', end: null }, () => m.rooms_activity_span_thinking())
    .with({ kind: 'thinking', calls: [P._, ...P.array()] }, ({ calls }) => m.rooms_activity_span_called({ tools: [...new Set(calls)].map((toolName) => toolPresentation({ toolName }).label).join(', ') }))
    .with({ kind: 'thinking', stop: 'error' }, () => m.rooms_activity_span_model_failed())
    .with({ kind: 'thinking', stop: 'aborted' }, () => m.rooms_activity_span_stopped())
    .with({ kind: 'thinking', stop: 'length' }, () => m.rooms_activity_span_limit())
    .with({ kind: 'thinking' }, () => m.rooms_activity_span_replied())
    .with({ kind: 'waiting', stop: 'approval' }, () => m.rooms_activity_span_approval())
    .with({ kind: 'waiting', stop: 'question' }, () => m.rooms_activity_span_question())
    .with({ kind: 'waiting' }, () => m.rooms_activity_span_subagent())
    .with({ tool: P.string, input: P.nonNullable }, ({ id, tool, input }) => (
      toolPreview({
        type: 'dynamic-tool',
        toolName: tool,
        toolCallId: id,
        state: 'input-available',
        input,
      }) ?? toolPresentation({ toolName: tool }).label
    ))
    .with({ tool: P.string }, ({ tool }) => toolPresentation({ toolName: tool }).label)
    .otherwise(() => m.rooms_activity_span_tool_running());

  const timeline = (data: UniversalTypes.ActivityRun): AgentTimelineRun => {
    const children = data.agents.filter((agent) => !agent.isMain);

    return {
      title,
      startedAt: data.startedAt,
      duration: data.isLive ? undefined : data.durationMs / 1000,
      agents: data.agents.map((agent) => ({
        id: agent.id,
        name: agent.isMain ? bot.name : agent.name ?? `${m.rooms_activity_subagent()} ${children.indexOf(agent) + 1}`,
        model: agent.model ?? undefined,
        mark: agent.model ? <BotBrandLogo brand={botModelBrand({ providerId: '', modelId: agent.model })} className="size-3" /> : undefined,
      })),
      spans: data.spans.map((span) => ({
        id: span.id,
        agentId: span.agentId,
        kind: span.kind,
        start: span.start,
        end: span.end ?? undefined,
        label: label(span),
        detail: span.detail ?? undefined,
        tool: span.tool ? { name: toolPresentation({ toolName: span.tool }).label, mark: <ToolIcon toolName={span.tool} /> } : undefined,
        tokens: span.tokens ?? undefined,
        cost: span.cost ?? undefined,
        status: span.isFailed ? 'failed' : 'ok',
        retry: span.isRetry,
      })),
      handoffs: data.handoffs.map((handoff) => ({
        from: handoff.from,
        to: handoff.to,
        at: handoff.at,
        label: handoff.kind === 'dispatch' ? m.rooms_activity_handoff_dispatch() : m.rooms_activity_handoff_result(),
      })),
    };
  };

  if (detail.isError) {
    return (
      <div className="flex items-center gap-3 px-4 pb-4 text-sm text-muted-foreground">
        <span>{m.rooms_activity_run_error()}</span>
        <Button
          size="xs"
          variant="outline"
          onClick={() => void detail.refetch()}
        >
          {m.rooms_activity_retry()}
        </Button>
      </div>
    );
  }

  if (!detail.data) {
    return (
      <div className="h-56 overflow-hidden rounded-4xl">
        <Skeleton className="size-full" />
      </div>
    );
  }

  return (
    <AgentTimeline
      live={detail.data.isLive}
      run={timeline(detail.data)}
    />
  );
}
