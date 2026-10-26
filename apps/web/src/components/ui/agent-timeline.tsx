import { m } from '@repo/i18n/client';
import { useHydrated } from '@tanstack/react-router';
import { AnimatePresence, useInView, useReducedMotion } from 'motion/react';
import { Fragment, useEffect, useEffectEvent, useId, useLayoutEffect, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import { AgentTimelineCard } from '@/components/ui/agent-timeline-card';
import { AgentTimelineSpan } from '@/components/ui/agent-timeline-span';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/cn';
import { AGENT_TIMELINE } from '@/services/agent-timeline/agent-timeline.constants';
import {
  agentTimelineAt,
  agentTimelineClamp,
  agentTimelineCost,
  agentTimelineDuration,
  agentTimelineLinkStyle,
  agentTimelineLiveAxis,
  agentTimelineModel,
  agentTimelinePath,
  agentTimelinePortStyle,
  agentTimelineProgress,
  agentTimelineSeconds,
  agentTimelineTick,
  agentTimelineTickStep,
  agentTimelineTokens,
} from '@/services/agent-timeline/agent-timeline.utils';
import IconBot from '~icons/lucide/bot';
import IconCircleCheck from '~icons/lucide/circle-check';
import IconCircleX from '~icons/lucide/circle-x';
import IconCornerDownRight from '~icons/lucide/corner-down-right';
import IconPause from '~icons/lucide/pause';
import IconPlay from '~icons/lucide/play';
import IconRotateCcw from '~icons/lucide/rotate-ccw';
import type * as AgentTimelineTypes from '@/types/agent-timeline.types';
import type { KeyboardEvent, PointerEvent } from 'react';

interface AgentTimelineProps {
  run: AgentTimelineTypes.AgentTimelineRun
  live?: boolean
}

export function AgentTimeline({ run, live = false }: AgentTimelineProps) {
  const model = agentTimelineModel(run);
  const duration = Math.max(model.duration, 0.001);
  const lastEnd = Math.max(0, ...model.spans.map((span) => (span.isOpen ? span.start : span.end)));

  const uid = useId();
  const isHydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const isReduced = isHydrated && Boolean(prefersReduced);

  const rootRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef(live ? 0 : duration);
  const axisRef = useRef(live ? agentTimelineLiveAxis(0, 0) : duration);
  const renderedAt = useRef(0);
  const speedRef = useRef(1);
  const scrubRef = useRef<{ id: number } | null>(null);

  const followRef = useRef({
    auto: 0,
    manualUntil: 0,
    plotLeft: 0,
    plotWidth: 360,
    labels: 0,
  });

  const leaveTimer = useRef(0);
  const liveStart = useRef(0);

  const isInView = useInView(rootRef, { amount: 0.2 });
  const [time, setTime] = useState(() => (live ? 0 : duration));
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [axisState, setAxisState] = useState(() => (live ? agentTimelineLiveAxis(0, 0) : duration));
  const [plotWidth, setPlotWidth] = useState(360);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [rovingId, setRovingId] = useState<string | null>(null);
  const [scrollTick, setScrollTick] = useState(0);
  const [wasLive, setWasLive] = useState(live);

  if (wasLive !== live) {
    setWasLive(live);

    if (!live) {
      setTime(duration);
      setIsPlaying(false);
      setAxisState(duration);
    }
  }

  const shownT = live ? time : Math.min(time, duration);
  const axis = live ? axisState : duration;
  const isDone = !live && shownT >= duration - 1e-6;
  const isRunning = isPlaying || live;

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  const commit = (next: number, isForced = false) => {
    timeRef.current = next;
    plotRef.current?.style.setProperty('--now', next.toFixed(3));

    const now = performance.now();

    if (isForced || now - renderedAt.current >= 48) {
      renderedAt.current = now;
      setTime(next);
    }
  };

  const follow = (at: number) => {
    const scroller = scrollerRef.current;
    const state = followRef.current;

    if (!scroller || scroller.scrollWidth <= scroller.clientWidth + 1 || performance.now() < state.manualUntil) {
      return;
    }

    const x = state.plotLeft + (at / Math.max(axisRef.current, 0.001)) * state.plotWidth;
    const view = scroller.clientWidth - state.labels;
    const target = agentTimelineClamp(x - state.labels - view * 0.62, 0, scroller.scrollWidth - scroller.clientWidth);

    if (target > scroller.scrollLeft + 0.5) {
      state.auto = target;
      scroller.scrollLeft = target;
    }
  };

  const advance = useEffectEvent((next: number, isForced: boolean) => {
    commit(next, isForced);
    follow(next);
  });

  useEffect(() => {
    if (!isPlaying || live || isScrubbing || !isInView) {
      return;
    }

    let frame = 0;
    let last = performance.now();

    const step = (now: number) => {
      const delta = agentTimelineClamp((now - last) / 1000, 0, 0.1);
      last = now;

      const next = Math.min(duration, timeRef.current + delta * speedRef.current);
      advance(next, next >= duration);

      if (next >= duration) {
        setIsPlaying(false);
        return;
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [isPlaying, live, isScrubbing, isInView, duration]);

  useEffect(() => {
    if (!live) {
      return;
    }

    liveStart.current ||= Date.now();

    const origin = run.startedAt ?? liveStart.current;
    const plot = plotRef.current;
    let frame = 0;
    let last = performance.now();
    let target = axisRef.current;

    const step = (now: number) => {
      const delta = agentTimelineClamp((now - last) / 1000, 0, 0.1);
      last = now;

      const at = Math.max(0, (Date.now() - origin) / 1000);
      const next = agentTimelineLiveAxis(at, lastEnd);

      if (next !== target) {
        target = next;
        setAxisState(next);
      }

      const shown = isReduced ? target : axisRef.current + (target - axisRef.current) * (1 - Math.exp(-delta * 7));
      axisRef.current = Math.abs(target - shown) < 0.005 ? target : shown;
      plot?.style.setProperty('--axis', axisRef.current.toFixed(3));
      advance(at, false);
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      plot?.style.removeProperty('--axis');
    };
  }, [live, run.startedAt, lastEnd, isReduced]);

  useEffect(() => {
    if (!live) {
      axisRef.current = duration;
    }
  }, [live, duration]);

  useLayoutEffect(() => {
    if (isRunning || isScrubbing) {
      return;
    }

    timeRef.current = shownT;
    plotRef.current?.style.setProperty('--now', shownT.toFixed(3));
  }, [isRunning, isScrubbing, shownT]);

  useEffect(() => {
    const plot = plotRef.current;
    const scroller = scrollerRef.current;

    if (!plot || !scroller) {
      return;
    }

    const observer = new ResizeObserver(() => {
      const area = plot.getBoundingClientRect();
      const frame = scroller.getBoundingClientRect();

      Object.assign(followRef.current, {
        plotLeft: area.left - frame.left + scroller.scrollLeft,
        plotWidth: area.width,
        labels: labelsRef.current?.offsetWidth ?? 0,
      });

      setPlotWidth(Math.round(area.width));
    });

    observer.observe(plot);
    observer.observe(scroller);

    return () => observer.disconnect();
  }, []);

  const byId = new Map(model.spans.map((span) => [span.id, span]));
  const path = agentTimelinePath(model, pinnedId);
  const isVisible = (span: AgentTimelineTypes.AgentTimelineBar) => span.start <= shownT + 1e-6;
  const shownId = hoverId ?? focusId ?? pinnedId;
  const shownSpan = shownId ? byId.get(shownId) : undefined;
  const cardSpan = shownSpan && isVisible(shownSpan) ? shownSpan : undefined;
  const rovingSpan = rovingId ? byId.get(rovingId) : undefined;
  const roving = rovingSpan && isVisible(rovingSpan) ? rovingSpan.id : model.spans.find(isVisible)?.id ?? null;
  const [initialLinks] = useState(() => new Set(model.connectors.filter((link) => link.at <= (live ? 0 : duration)).map((link) => link.id)));

  const hover = (id: string) => {
    window.clearTimeout(leaveTimer.current);
    setHoverId(id);
  };

  const unhover = () => {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setHoverId(null), 80);
  };

  const focusSpan = (id: string, isKeyboard: boolean) => {
    setRovingId(id);

    if (isKeyboard) {
      setFocusId(id);
    }
  };

  const pick = (id: string) => {
    const next = pinnedId === id ? null : id;
    setPinnedId(next);
    setRovingId(id);
  };

  const unpin = () => {
    if (!pinnedId) {
      return;
    }

    setPinnedId(null);
  };

  useEffect(() => {
    const root = rootRef.current;

    if (!root || !pinnedId) {
      return;
    }

    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      setPinnedId(null);
    };

    root.addEventListener('keydown', onKey);

    return () => root.removeEventListener('keydown', onKey);
  }, [pinnedId]);

  const rewind = () => {
    commit(0, true);
    unpin();
    setHoverId(null);
    followRef.current.manualUntil = 0;
    scrollerRef.current?.scrollTo({ left: 0, behavior: isReduced ? 'auto' : 'smooth' });
  };

  const play = () => {
    setHasInteracted(true);

    if (isRunning) {
      commit(timeRef.current, true);
      setIsPlaying(false);

      return;
    }

    if (isDone) {
      rewind();
    }

    setIsPlaying(true);
  };

  const restart = () => {
    setHasInteracted(true);
    rewind();
    setIsPlaying(true);
  };

  const timeFromPointer = (clientX: number) => {
    const area = plotRef.current?.getBoundingClientRect();

    return area && area.width > 0 ? agentTimelineClamp((clientX - area.left) / area.width, 0, 1) * duration : timeRef.current;
  };

  const onScrubStart = (event: PointerEvent<HTMLDivElement>) => {
    if (live || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    knobRef.current?.focus({ preventScroll: true });
    scrubRef.current = { id: event.pointerId };
    setHasInteracted(true);
    setIsScrubbing(true);
    commit(timeFromPointer(event.clientX), true);
  };

  const onScrubMove = (event: PointerEvent<HTMLDivElement>) => {
    if (scrubRef.current?.id === event.pointerId) {
      commit(timeFromPointer(event.clientX));
    }
  };

  const onScrubEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (scrubRef.current?.id !== event.pointerId) {
      return;
    }

    scrubRef.current = null;
    setIsScrubbing(false);
    commit(timeRef.current, true);

    if (timeRef.current >= duration) {
      setIsPlaying(false);
    }
  };

  const onSpanKey = (event: KeyboardEvent<HTMLButtonElement>, span: AgentTimelineTypes.AgentTimelineBar) => {
    const rowSpans = (row: number) => model.byRow[row].filter(isVisible);
    const mid = (item: AgentTimelineTypes.AgentTimelineBar) => (item.start + Math.min(item.isOpen ? shownT : item.end, shownT)) / 2;
    const same = rowSpans(span.row);
    const index = same.findIndex((item) => item.id === span.id);

    const nearest = (direction: number) => model.agents
      .map((agent) => agent.index)
      .filter((row) => (direction > 0 ? row > span.row : row < span.row))
      .sort((a, b) => (a - b) * direction)
      .map((row) => rowSpans(row).reduce<AgentTimelineTypes.AgentTimelineBar | undefined>((best, item) => (
        !best || Math.abs(mid(item) - mid(span)) < Math.abs(mid(best) - mid(span)) ? item : best
      ), undefined))
      .find(Boolean);

    const next = match(event.key)
      .with('ArrowRight', () => same[index + 1])
      .with('ArrowLeft', () => same[index - 1])
      .with('Home', () => same[0])
      .with('End', () => same.at(-1))
      .with('ArrowDown', () => nearest(1))
      .with('ArrowUp', () => nearest(-1))
      .otherwise(() => null);

    if (next === null) {
      return;
    }

    event.preventDefault();

    if (next) {
      setRovingId(next.id);
      plotRef.current?.querySelector<HTMLElement>(`[data-span-id="${CSS.escape(next.id)}"]`)?.focus();
    }
  };

  const onScroll = () => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    scroller.toggleAttribute('data-scrolled', scroller.scrollLeft > 1);

    if (Math.abs(scroller.scrollLeft - followRef.current.auto) > 2) {
      followRef.current.manualUntil = performance.now() + 2500;
    }

    if (cardSpan) {
      setScrollTick((tick) => tick + 1);
    }
  };

  const tokensNow = model.spans.reduce((sum, span) => sum + (span.tokens ?? 0) * agentTimelineProgress(span, shownT), 0);
  const costNow = model.spans.reduce((sum, span) => sum + span.spanCost * agentTimelineProgress(span, shownT), 0);
  const activeRows = new Set(model.spans.filter((span) => span.kind !== 'waiting' && span.start <= shownT && shownT < span.end).map((span) => span.row));
  const agentCount = model.agents.length === 1 ? m.ui_timeline_agent() : m.ui_timeline_agents({ count: model.agents.length });

  const summary = [
    agentCount,
    agentTimelineDuration(duration),
    model.totals.speedup >= 1.1 ? m.ui_timeline_speedup({ value: model.totals.speedup.toFixed(1) }) : null,
    agentTimelineCost(model.totals.cost),
  ].filter((part) => part !== null);

  const word = match({ isRunning, isStart: shownT <= 0 })
    .with({ isRunning: true }, () => 'running' as const)
    .with({ isStart: true }, () => 'ready' as const)
    .otherwise(() => 'paused' as const);

  const announcement = match({
    isDone,
    isRunning,
    hasInteracted,
    live,
    isScrubbing,
  })
    .with({ isDone: true }, () => m.ui_timeline_finished_summary({ summary: summary.join(', ') }))
    .with({ hasInteracted: false }, () => '')
    .with({ isRunning: true, live: true }, () => m.ui_timeline_following())
    .with({ isRunning: true }, () => m.ui_timeline_replaying({ speed }))
    .with({ isScrubbing: false }, () => m.ui_timeline_paused_at({ time: agentTimelineSeconds(shownT) }))
    .otherwise(() => '');

  const step = agentTimelineTickStep(axis, plotWidth);
  const ticks = Array.from({ length: Math.floor(axis / step + 1e-6) + 1 }, (_, index) => Math.round(index * step * 100) / 100);
  const secondsWide = plotWidth / Math.max(axis, 0.001);
  const canDraw = isHydrated && !isReduced;
  const rowsHeight = AGENT_TIMELINE.pad + model.agents.length * AGENT_TIMELINE.row;
  const layoutKey = `${scrollTick}:${plotWidth}:${axisState}`;
  const shownLinks = model.connectors.filter((link) => link.at <= shownT + 1e-6);
  const isFailedRun = model.spans.some((span) => span.status === 'failed');

  const bodyStyle: AgentTimelineTypes.AgentTimelineStyle = {
    '--now': shownT,
    '--axis': axis,
    '--rows-h': `${rowsHeight}px`,
    '--row': `${AGENT_TIMELINE.row}px`,
    '--bar': `${AGENT_TIMELINE.bar}px`,
    '--pad': `${AGENT_TIMELINE.pad}px`,
    '--axis-h': `${AGENT_TIMELINE.axis}px`,
  };

  const laneStyle = (color: string): AgentTimelineTypes.AgentTimelineStyle => ({ '--c': color });

  const count = (value: string, reserve: string | undefined) => (
    <span className="inline-grid justify-items-end whitespace-nowrap tabular-nums *:[grid-area:1/1]">
      {reserve && reserve.length > value.length ? <span aria-hidden className="invisible">{reserve}</span> : null}
      <span className="text-card-foreground">{value}</span>
    </span>
  );

  const separator = (
    <>
      <span aria-hidden className="text-muted-foreground/70">{' ·'}</span>
      {' '}
    </>
  );

  return (
    <section
      aria-labelledby={`${uid}-title`}
      className={cn(
        '@container relative w-full min-w-0 rounded-4xl border bg-card text-sm text-card-foreground',
        '[--shine:color-mix(in_oklab,var(--background)_62%,transparent)] [--tint:24%]',
        'dark:[--shine:color-mix(in_oklab,var(--foreground)_22%,transparent)] dark:[--tint:34%]',
      )}
      ref={rootRef}
    >
      <div className="grid min-w-0 gap-4 py-5 [--gutter:--spacing(6)] [--label-w:176px] [--plot-min:320px] @max-[520px]:[--gutter:--spacing(4)] @max-[520px]:[--label-w:132px] @max-[520px]:[--plot-min:300px]">
        <header className="grid min-w-0 px-(--gutter)">
          <h3 className="sr-only" id={`${uid}-title`}>{run.title}</h3>
          <div className="grid min-w-0 text-xs text-muted-foreground">
            <p
              aria-hidden={isDone || undefined}
              className="invisible m-0 min-w-0 opacity-0 transition-[opacity,visibility] duration-100 [grid-area:1/1] data-on:visible data-on:opacity-100 data-on:duration-150 motion-reduce:transition-none"
              data-on={!isDone || undefined}
            >
              <span className="inline-grid text-card-foreground">
                <span
                  className="opacity-0 transition-opacity duration-100 [grid-area:1/1] data-on:opacity-100 data-on:duration-150 motion-reduce:transition-none"
                  data-on={word === 'running' || undefined}
                >
                  <span className={cn(isRunning && !isReduced && 'shimmer')}>{live ? m.ui_timeline_live() : m.ui_timeline_running()}</span>
                </span>
                {live ? null : (
                  <span
                    className="opacity-0 transition-opacity duration-100 [grid-area:1/1] data-on:opacity-100 data-on:duration-150 motion-reduce:transition-none"
                    data-on={word === 'paused' || undefined}
                  >
                    {m.ui_timeline_paused()}
                  </span>
                )}
                {live ? null : (
                  <span
                    className="opacity-0 transition-opacity duration-100 [grid-area:1/1] data-on:opacity-100 data-on:duration-150 motion-reduce:transition-none"
                    data-on={word === 'ready' || undefined}
                  >
                    {m.ui_timeline_ready()}
                  </span>
                )}
              </span>
              {separator}
              <span className="whitespace-nowrap text-card-foreground">{count(agentTimelineSeconds(shownT), live ? undefined : agentTimelineSeconds(duration))}</span>
              {separator}
              <span className="whitespace-nowrap text-card-foreground">
                {count(agentTimelineTokens(tokensNow), live ? undefined : agentTimelineTokens(model.totals.tokens))}
                {' '}
                <span className="text-muted-foreground">{m.ui_timeline_tokens_unit()}</span>
              </span>
              {separator}
              <span className="whitespace-nowrap text-card-foreground">{count(agentTimelineCost(costNow), live ? undefined : agentTimelineCost(model.totals.cost))}</span>
              {activeRows.size > 0 && isRunning ? <span className="sr-only">{`, ${m.ui_timeline_working({ count: activeRows.size })}`}</span> : null}
            </p>
            <p
              aria-hidden={!isDone || undefined}
              className="invisible m-0 min-w-0 opacity-0 transition-[opacity,visibility] duration-100 [grid-area:1/1] data-on:visible data-on:opacity-100 data-on:duration-150 motion-reduce:transition-none"
              data-on={isDone || undefined}
            >
              <IconCircleCheck aria-hidden className="mr-1 inline-block size-3.5 align-[-3px] text-success" />
              <span className="sr-only">{`${m.ui_timeline_finished()}: `}</span>
              {summary.map((part, index) => (
                <Fragment key={part}>
                  {index > 0 ? separator : null}
                  <span className="whitespace-nowrap text-card-foreground">{part}</span>
                </Fragment>
              ))}
            </p>
          </div>
        </header>

        <div
          className="group/scroller scrollbar min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1"
          ref={scrollerRef}
          onScroll={onScroll}
        >
          <div className="grid min-w-0 grid-cols-[var(--label-w)_minmax(calc(var(--plot-min)+12px+var(--gutter)),1fr)]" style={bodyStyle}>
            <div
              className="sticky left-0 z-6 min-w-0 bg-card pt-(--pad) pr-3 pb-(--axis-h) pl-(--gutter) transition-shadow duration-150 group-data-scrolled/scroller:shadow-[1px_0_0_var(--border)]"
              ref={labelsRef}
            >
              {model.agents.map((agent) => (
                <div
                  className="grid h-(--row) min-w-0 grid-cols-[8px_minmax(0,1fr)] content-center items-center gap-x-2.5 [grid-template-areas:'dot_name'_'._model'] @max-[520px]:[grid-template-areas:'dot_name']"
                  id={`${uid}-row-${agent.index}`}
                  key={agent.id}
                  style={laneStyle(agent.color)}
                >
                  <span aria-hidden className="size-2 flex-none rounded-full bg-(--c) [grid-area:dot]" />
                  <span className="truncate [grid-area:name]">{agent.name}</span>
                  {agent.model ? (
                    <span className="flex min-w-0 items-center gap-[5px] text-xs text-muted-foreground/70 [grid-area:model] @max-[520px]:hidden">
                      <span aria-hidden className="inline-grid size-3 flex-none text-muted-foreground [&>svg]:size-full">{agent.mark ?? <IconBot />}</span>
                      <span className="truncate">{agent.model}</span>
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="min-w-0 pr-(--gutter) pl-3">
              <div className="group/plot relative h-[calc(var(--rows-h)+var(--axis-h))]" data-path={path ? '' : undefined} ref={plotRef}>
                <button
                  aria-label={m.ui_timeline_clear()}
                  className="absolute inset-x-0 top-0 h-(--rows-h) cursor-default"
                  tabIndex={-1}
                  type="button"
                  onClick={unpin}
                />
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 bottom-(--axis-h)">
                  {ticks.map((value) => (
                    <span className="absolute inset-y-0 -ml-[.5px] w-px bg-border/50" key={value} style={{ left: `calc(${agentTimelineAt(value)})` }} />
                  ))}
                </div>
                <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
                  {shownLinks.map((link) => (
                    <span
                      className={cn(
                        'absolute box-border border-0 border-solid border-(--c) transition-opacity duration-150 motion-reduce:animate-none motion-reduce:transition-none',
                        'data-[route=out]:data-[dir=down]:rounded-bl-[7px] data-[route=out]:data-[dir=down]:border-b-[1.5px] data-[route=out]:data-[dir=down]:border-l-[1.5px]',
                        'data-[route=out]:data-[dir=up]:rounded-tl-[7px] data-[route=out]:data-[dir=up]:border-t-[1.5px] data-[route=out]:data-[dir=up]:border-l-[1.5px]',
                        'data-[route=in]:data-[dir=up]:rounded-br-[7px] data-[route=in]:data-[dir=up]:border-r-[1.5px] data-[route=in]:data-[dir=up]:border-b-[1.5px]',
                        'data-[route=in]:data-[dir=down]:rounded-tr-[7px] data-[route=in]:data-[dir=down]:border-t-[1.5px] data-[route=in]:data-[dir=down]:border-r-[1.5px]',
                        'data-[route=line]:border-l-[1.5px]',
                        'data-draw:data-[dir=down]:animate-timeline-draw-down data-draw:data-[dir=up]:animate-timeline-draw-up',
                        'group-data-path/plot:not-data-hot:opacity-15',
                      )}
                      data-dir={link.isUp ? 'up' : 'down'}
                      data-draw={(canDraw && (hasInteracted || live || !initialLinks.has(link.id))) || undefined}
                      data-hot={path?.links.has(link.id) ? true : undefined}
                      data-route={link.route}
                      key={link.id}
                      style={agentTimelineLinkStyle(link)}
                    />
                  ))}
                </div>
                {model.agents.map((agent) => (
                  <fieldset
                    aria-labelledby={`${uid}-row-${agent.index}`}
                    className="pointer-events-none absolute inset-x-0 z-2 m-0 h-(--row) min-w-0 border-0 p-0"
                    key={agent.id}
                    style={{ ...laneStyle(agent.color), top: AGENT_TIMELINE.pad + agent.index * AGENT_TIMELINE.row }}
                  >
                    {model.byRow[agent.index].filter(isVisible).map((span) => (
                      <AgentTimelineSpan
                        agentName={agent.name}
                        hasIcon={!span.isOpen && (span.end - span.start) * secondsWide >= AGENT_TIMELINE.iconMinPx}
                        isActive={span.isOpen ? live : shownT < span.end}
                        isDim={Boolean(path) && !path?.spans.has(span.id)}
                        isPinned={pinnedId === span.id}
                        isTabbable={roving === span.id}
                        key={span.id}
                        span={span}
                        onBlurSpan={() => setFocusId(null)}
                        onFocusSpan={focusSpan}
                        onHover={hover}
                        onKey={onSpanKey}
                        onLeave={unhover}
                        onPick={pick}
                      />
                    ))}
                  </fieldset>
                ))}
                <div aria-hidden className="pointer-events-none absolute inset-0 z-3">
                  {shownLinks.map((link) => (
                    <span
                      className={cn(
                        'absolute -mt-[3.5px] -ml-[3.5px] size-[7px] rounded-full bg-(--c) shadow-[0_0_0_1.5px_var(--card)] transition-opacity duration-150',
                        'group-data-path/plot:not-data-hot:opacity-15 data-draw:animate-timeline-port-in motion-reduce:animate-none motion-reduce:transition-none',
                      )}
                      data-draw={(canDraw && (hasInteracted || live || !initialLinks.has(link.id))) || undefined}
                      data-hot={path?.links.has(link.id) ? true : undefined}
                      key={link.id}
                      style={agentTimelinePortStyle(link)}
                    />
                  ))}
                </div>
                <div
                  aria-hidden
                  className="pointer-events-none absolute top-0 left-[calc(min(var(--now),var(--axis))/var(--axis)*100%)] z-4 -ml-[.5px] h-(--rows-h) w-px bg-card-foreground opacity-50 transition-opacity duration-200 data-settled:opacity-0 motion-reduce:transition-none"
                  data-settled={(isDone && !isScrubbing) || undefined}
                />
                <div
                  className="group/axis absolute inset-x-0 top-(--rows-h) z-5 h-(--axis-h) cursor-ew-resize touch-none border-t select-none data-live:cursor-default"
                  data-live={live || undefined}
                  onPointerCancel={onScrubEnd}
                  onPointerDown={onScrubStart}
                  onPointerMove={onScrubMove}
                  onPointerUp={onScrubEnd}
                >
                  {ticks.map((value) => (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-[9px] -translate-x-1/2 text-xs leading-none whitespace-nowrap text-muted-foreground/70 tabular-nums"
                      key={value}
                      style={{ left: `calc(${agentTimelineAt(value)})` }}
                    >
                      {agentTimelineTick(value)}
                    </span>
                  ))}
                  <input
                    aria-label={m.ui_timeline_scrubber()}
                    aria-valuetext={m.ui_timeline_scrubber_value({ time: agentTimelineSeconds(shownT), total: agentTimelineSeconds(live ? shownT : duration) })}
                    className="peer sr-only"
                    disabled={live}
                    max={Number(duration.toFixed(1))}
                    min={0}
                    ref={knobRef}
                    step={0.5}
                    type="range"
                    value={Number(shownT.toFixed(1))}
                    onChange={(event) => {
                      setHasInteracted(true);
                      commit(agentTimelineClamp(Number(event.currentTarget.value), 0, duration), true);
                    }}
                  />
                  <span
                    aria-hidden
                    className={cn(
                      'pointer-events-none absolute -top-px left-[calc(min(var(--now),var(--axis))/var(--axis)*100%)] -mt-[4.5px] -ml-[4.5px] size-[9px] rounded-full bg-card-foreground',
                      'shadow-[0_0_0_2px_var(--card)] transition-[scale] duration-150 peer-focus-visible:scale-130 data-active:scale-130',
                      'group-[:not([data-live]):hover]/axis:scale-130 motion-reduce:transition-none',
                    )}
                    data-active={isScrubbing || undefined}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 px-(--gutter)">
          {live ? null : (
            <div className="flex items-center gap-1.5">
              <Button
                aria-label={match({ isRunning, isDone })
                  .with({ isRunning: true }, () => m.ui_timeline_pause())
                  .with({ isDone: true }, () => m.ui_timeline_replay())
                  .otherwise(() => m.ui_timeline_play())}
                size="icon-sm"
                variant="outline"
                onClick={play}
              >
                <span aria-hidden className="group/glyph grid size-4" data-playing={isRunning || undefined}>
                  <IconPlay className="size-4 translate-x-[.5px] transition-opacity duration-150 [grid-area:1/1] *:fill-current group-data-playing/glyph:opacity-0 group-data-playing/glyph:duration-100" />
                  <IconPause className="size-4 opacity-0 transition-opacity duration-100 [grid-area:1/1] *:fill-current group-data-playing/glyph:opacity-100 group-data-playing/glyph:duration-150" />
                </span>
              </Button>
              <Button aria-label={m.ui_timeline_restart()} size="icon-sm" variant="ghost" onClick={restart}>
                <IconRotateCcw aria-hidden className="size-4" />
              </Button>
              <Tabs value={String(speed)} onValueChange={(value) => setSpeed(Number(value))}>
                <TabsList aria-label={m.ui_timeline_speed()}>
                  {AGENT_TIMELINE.speeds.map((option) => <TabsTrigger key={option} value={String(option)}>{`${option}x`}</TabsTrigger>)}
                </TabsList>
              </Tabs>
            </div>
          )}
          <ul aria-label={m.ui_timeline_legend()} className="m-0 flex list-none flex-wrap items-center gap-x-3.5 gap-y-1 p-0 text-xs text-muted-foreground">
            <li className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span aria-hidden className="h-2 w-3.5 rounded-[3px] bg-[color-mix(in_oklab,var(--muted-foreground)_28%,var(--card))]" />
              {m.ui_timeline_thinking()}
            </li>
            <li className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span aria-hidden className="h-2 w-3.5 rounded-[3px] bg-muted-foreground" />
              {m.ui_timeline_tool()}
            </li>
            <li className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span
                aria-hidden
                className="h-2 w-3.5 rounded-[3px] bg-[repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--muted-foreground)_40%,transparent)_0_1px,transparent_1px_4px)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--muted-foreground)_30%,transparent)]"
              />
              {m.ui_timeline_waiting()}
            </li>
            <li className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <IconCornerDownRight aria-hidden className="size-[13px] text-muted-foreground/70" />
              {m.ui_timeline_handoff()}
            </li>
            {isFailedRun ? (
              <li className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <IconCircleX aria-hidden className="size-[13px] text-destructive" />
                {m.ui_timeline_failed()}
              </li>
            ) : null}
          </ul>
        </footer>
      </div>

      <AnimatePresence>
        {cardSpan ? (
          <AgentTimelineCard
            axisRef={axisRef}
            isReduced={isReduced}
            key="card"
            layoutKey={layoutKey}
            model={model}
            now={shownT}
            plotRef={plotRef}
            rootRef={rootRef}
            span={cardSpan}
          />
        ) : null}
      </AnimatePresence>
      <p aria-live="polite" className="sr-only">{announcement}</p>
    </section>
  );
}
