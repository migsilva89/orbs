import { getLocale } from '@repo/i18n/runtime';
import { match, P } from 'ts-pattern';
import { AGENT_TIMELINE } from './agent-timeline.constants';
import type * as TimelineTypes from '../../types/agent-timeline.types';

export const agentTimelineCenter = (row: number) => AGENT_TIMELINE.pad + row * AGENT_TIMELINE.row + AGENT_TIMELINE.row / 2;
export const agentTimelineAt = (seconds: number) => `${seconds} / var(--axis) * 100%`;
export const agentTimelineClamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function agentTimelineConnector({ handoff, index, from, to, byRow, agents }: TimelineTypes.AgentTimelineConnectorParams): TimelineTypes.AgentTimelineConnector {
  const { at } = handoff;
  const agentTimelineCovering = (row: TimelineTypes.AgentTimelineBar[]) => row.find((span) => span.start <= at && at < span.end);
  const source = agentTimelineCovering(byRow[from]);
  const ending = source ? undefined : byRow[from].filter((span) => !span.isOpen && span.end <= at + 0.01 && span.end >= at - 1.5).at(-1);
  const starting = byRow[to].find((span) => span.start >= at - 0.01 && span.start <= at + 2);
  const leadIn = ending ? at - ending.end : 0;
  const leadOut = starting ? starting.start - at : 0;

  const route = match({ leadIn, leadOut })
    .when(({ leadIn: value }) => value > 0.05 && value > leadOut, () => 'in' as const)
    .when(({ leadOut: value }) => value > 0.05 || (!ending && !agentTimelineCovering(byRow[to])), () => 'out' as const)
    .otherwise(() => 'line' as const);

  return {
    id: `h${index}`,
    handoff,
    from,
    to,
    at,
    route,
    isUp: to < from,
    color: route === 'in' ? agents[from].color : agents[to].color,
    x0: route === 'in' ? ending?.end ?? at : at,
    x1: route === 'out' ? starting?.start ?? at : at,
    sourceSpan: (route === 'in' ? ending : source ?? ending)?.id,
    targetSpan: (starting ?? agentTimelineCovering(byRow[to]))?.id,
  };
}

export function agentTimelineModel(run: TimelineTypes.AgentTimelineRun): TimelineTypes.AgentTimelineModel {
  const handoffs = run.handoffs ?? [];
  const rows = new Map(run.agents.map((agent, index) => [agent.id, index]));

  const agents = run.agents.map((agent, index) => ({
    ...agent,
    index,
    color: index === 0 ? AGENT_TIMELINE.lead : AGENT_TIMELINE.series[(index - 1) % AGENT_TIMELINE.series.length],
  }));

  const spans = run.spans
    .flatMap((span, index) => match(rows.get(span.agentId))
      .with(P.number, (row) => [{
        ...span,
        id: span.id ?? `${span.agentId}-${index}`,
        index,
        row,
        end: span.end ?? Number.POSITIVE_INFINITY,
        isOpen: span.end === undefined,
        spanCost: span.cost ?? 0,
      }])
      .otherwise(() => []))
    .sort((a, b) => a.start - b.start || a.row - b.row)
    .map((span, index) => ({ ...span, index }));

  const byRow = agents.map((agent) => spans.filter((span) => span.row === agent.index));
  const last = Math.max(0, ...spans.map((span) => (span.isOpen ? span.start : span.end)), ...handoffs.map((handoff) => handoff.at));

  const connectors = handoffs.flatMap((handoff, index) => match({ from: rows.get(handoff.from), to: rows.get(handoff.to) })
    .with({ from: P.number, to: P.number }, ({ from, to }) => (from === to ? [] : [agentTimelineConnector({
      handoff,
      index,
      from,
      to,
      byRow,
      agents,
    })]))
    .otherwise(() => []));

  const done = spans.filter((span) => !span.isOpen);
  const duration = run.duration ?? last;
  const busy = done.filter((span) => span.kind !== 'waiting').reduce((sum, span) => sum + (span.end - span.start), 0);

  return {
    agents,
    spans,
    byRow,
    connectors,
    duration,
    totals: {
      tokens: spans.reduce((sum, span) => sum + (span.tokens ?? 0), 0),
      cost: spans.reduce((sum, span) => sum + span.spanCost, 0),
      speedup: duration > 0 ? busy / duration : 0,
    },
  };
}

export function agentTimelineProgress(span: TimelineTypes.AgentTimelineBar, time: number) {
  return match({
    isBefore: time <= span.start,
    isOpen: span.isOpen,
    length: span.end - span.start,
  })
    .with({ isBefore: true }, () => 0)
    .with({ isOpen: true }, () => 1)
    .with({ length: P.number.lte(0) }, () => 1)
    .otherwise(({ length }) => Math.min(1, (time - span.start) / length));
}

export function agentTimelinePath(model: TimelineTypes.AgentTimelineModel, id: string | null): TimelineTypes.AgentTimelinePath | null {
  const span = model.spans.find((item) => item.id === id);

  if (!span) {
    return null;
  }

  const spans = new Set([span.id]);
  const links = new Set<string>();

  const agentTimelineLinkAdd = (link: TimelineTypes.AgentTimelineConnector | undefined) => {
    if (!link) {
      return;
    }

    links.add(link.id);

    if (link.sourceSpan) {
      spans.add(link.sourceSpan);
    }

    if (link.targetSpan) {
      spans.add(link.targetSpan);
    }
  };

  if (span.row === 0) {
    model.connectors.filter((link) => link.sourceSpan === span.id || link.targetSpan === span.id).forEach(agentTimelineLinkAdd);
    return { spans, links };
  }

  const inbound = model.connectors.filter((link) => link.to === span.row && link.at <= span.start + 0.01).at(-1);
  const outbound = model.connectors.find((link) => link.from === span.row && link.at >= span.end - 0.01);
  const from = inbound?.at ?? Number.NEGATIVE_INFINITY;
  const to = outbound?.at ?? Number.POSITIVE_INFINITY;

  model.byRow[span.row].filter((item) => item.start >= from - 0.01 && item.end <= to + 0.01).forEach((item) => spans.add(item.id));
  [inbound, outbound].forEach(agentTimelineLinkAdd);

  return { spans, links };
}

export function agentTimelineTickStep(axis: number, width: number) {
  const perSecond = width / Math.max(axis, 0.001);
  return AGENT_TIMELINE.ticks.find((step) => step * perSecond >= AGENT_TIMELINE.tickGap) ?? AGENT_TIMELINE.ticks.at(-1) ?? 600;
}

export function agentTimelineTick(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);

  return match({ seconds, rest })
    .with({ seconds: P.number.lt(60) }, () => `${seconds}s`)
    .with({ rest: 0 }, () => `${minutes}m`)
    .otherwise(() => `${minutes}m ${rest}s`);
}

export function agentTimelineSeconds(seconds: number) {
  return match(seconds)
    .with(P.number.lt(100), (value) => `${value.toFixed(1)}s`)
    .otherwise((value) => `${Math.floor(value / 60)}m ${String(Math.floor(value % 60)).padStart(2, '0')}s`);
}

export const agentTimelineDuration = (seconds: number) => (seconds < 10 ? `${seconds.toFixed(1)}s` : agentTimelineSeconds(seconds));
export const agentTimelineTokens = (tokens: number) => new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 }).format(Math.round(tokens));

export const agentTimelineCost = (cost: number) => new Intl.NumberFormat(getLocale(), {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(cost);

export function agentTimelineLiveAxis(now: number, last: number) {
  const need = Math.max(now + 4, last + 1, 10);

  const step = match(need)
    .with(P.number.lte(30), () => 10)
    .with(P.number.lte(120), () => 30)
    .otherwise(() => 60);

  return Math.ceil(need / step) * step;
}

export function agentTimelineLinkStyle(link: TimelineTypes.AgentTimelineConnector): TimelineTypes.AgentTimelineStyle {
  const { bar, line } = AGENT_TIMELINE;
  const agentTimelineTop = (row: number) => agentTimelineCenter(row) - bar / 2;
  const agentTimelineBottom = (row: number) => agentTimelineCenter(row) + bar / 2;

  const [y0, y1] = match(link)
    .with({ route: 'out', isUp: true }, () => [agentTimelineCenter(link.to) - line / 2, agentTimelineTop(link.from)])
    .with({ route: 'out' }, () => [agentTimelineBottom(link.from), agentTimelineCenter(link.to) + line / 2])
    .with({ route: 'in', isUp: true }, () => [agentTimelineBottom(link.to), agentTimelineCenter(link.from) + line / 2])
    .with({ route: 'in' }, () => [agentTimelineCenter(link.from) - line / 2, agentTimelineTop(link.to)])
    .with({ isUp: true }, () => [agentTimelineBottom(link.to), agentTimelineTop(link.from)])
    .otherwise(() => [agentTimelineBottom(link.from), agentTimelineTop(link.to)]);

  return {
    '--c': link.color,
    top: y0,
    height: Math.max(0, y1 - y0),
    left: `calc(${agentTimelineAt(link.x0)} - ${link.route === 'in' ? 0 : line / 2}px)`,
    width: link.route === 'line' ? line : `calc(${agentTimelineAt(link.x1 - link.x0)} + ${line / 2}px)`,
  };
}

export function agentTimelinePortStyle(link: TimelineTypes.AgentTimelineConnector): TimelineTypes.AgentTimelineStyle {
  const row = link.route === 'in' ? link.to : link.from;
  const isBelow = link.route === 'in' ? link.isUp : !link.isUp;

  return {
    '--c': link.color,
    '--delay': link.route === 'in' ? '260ms' : '0ms',
    top: agentTimelineCenter(row) + (isBelow ? AGENT_TIMELINE.bar / 2 : -AGENT_TIMELINE.bar / 2),
    left: `calc(${agentTimelineAt(link.at)})`,
  };
}
