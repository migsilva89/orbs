import { m } from '@repo/i18n/client';
import { animate, AnimatePresence, useMotionValue } from 'motion/react';
import * as motion from 'motion/react-m';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { match } from 'ts-pattern';
import IconCircleX from '~icons/lucide/circle-x';
import IconCornerDownRight from '~icons/lucide/corner-down-right';
import IconCornerUpLeft from '~icons/lucide/corner-up-left';
import IconRotateCw from '~icons/lucide/rotate-cw';
import IconWrench from '~icons/lucide/wrench';
import { AGENT_TIMELINE } from '../services/agent-timeline/agent-timeline.constants';
import { agentTimelineCenter, agentTimelineClamp, agentTimelineDuration, agentTimelineTokens } from '../services/agent-timeline/agent-timeline.utils';
import type { AgentTimelineBar, AgentTimelineModel, AgentTimelineStyle } from '../types/agent-timeline.types';
import type { RefObject } from 'react';

interface AgentTimelineCardProps {
  span: AgentTimelineBar
  model: AgentTimelineModel
  now: number
  layoutKey: string
  isReduced: boolean
  rootRef: RefObject<HTMLElement | null>
  plotRef: RefObject<HTMLDivElement | null>
  axisRef: RefObject<number>
}

export function AgentTimelineCard({ span, model, now, layoutKey, isReduced, rootRef, plotRef, axisRef }: AgentTimelineCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const shift = useMotionValue('0%');
  const height = useMotionValue<number | 'auto'>('auto');
  const placed = useRef<{ id: string, isAbove: boolean } | null>(null);
  const content = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const plot = plotRef.current;

    if (!root || !plot) {
      return;
    }

    const box = root.getBoundingClientRect();
    const area = plot.getBoundingClientRect();
    const width = Math.min(AGENT_TIMELINE.cardWidth, box.width - 16);
    const left = area.left - box.left + (span.start / Math.max(axisRef.current, 0.001)) * area.width;
    const barTop = area.top - box.top + agentTimelineCenter(span.row) - AGENT_TIMELINE.bar / 2;
    const isAbove = barTop - 10 - AGENT_TIMELINE.cardEstimate > 0;
    const nextX = agentTimelineClamp(left - 12, 8, box.width - width - 8);
    const nextY = isAbove ? barTop - 8 : barTop + AGENT_TIMELINE.bar + 8;
    const previous = placed.current;

    placed.current = { id: span.id, isAbove };

    if (!previous || isReduced || previous.isAbove !== isAbove || previous.id === span.id) {
      x.jump(nextX);
      y.jump(nextY);
      shift.jump(isAbove ? '-100%' : '0%');

      return;
    }

    animate(x, nextX, AGENT_TIMELINE.card.glide);
    animate(y, nextY, AGENT_TIMELINE.card.glide);
  }, [span.id, span.start, span.row, layoutKey, isReduced, rootRef, plotRef, axisRef, x, y, shift]);

  useEffect(() => {
    const node = content.current;

    if (!node) {
      return;
    }

    let isFirst = true;

    const observer = new ResizeObserver(([entry]) => {
      const next = entry.borderBoxSize[0]?.blockSize ?? node.offsetHeight;

      if (isFirst || isReduced) {
        height.jump(next);
        isFirst = false;

        return;
      }

      animate(height, next, AGENT_TIMELINE.card.smooth);
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [height, isReduced]);

  const agent = model.agents[span.row];
  const isDone = !span.isOpen && now >= span.end;
  const isFailed = span.status === 'failed' && isDone;
  const elapsed = span.isOpen ? Math.max(0, now - span.start) : Math.min(now, span.end) - span.start;

  const links = model.connectors.filter((link) => (
    (link.targetSpan === span.id && link.to === span.row) || (link.sourceSpan === span.id && link.from === span.row)
  ));

  const visibleLinks = links.filter((link) => link.at <= now + 0.01);
  const headStyle: AgentTimelineStyle = { '--c': agent.color };

  const kind = match(span.kind)
    .with('thinking', () => m.ui_timeline_thinking())
    .with('tool', () => m.ui_timeline_tool())
    .with('waiting', () => m.ui_timeline_waiting())
    .exhaustive();

  const handoffs = match(visibleLinks.length)
    .with(0, () => null)
    .when((count) => count > 2, (count) => (
      <p className="mt-0.5 mb-0 flex items-start gap-1.5 text-xs text-muted-foreground [&_svg]:mt-[1.5px] [&_svg]:size-[13px] [&_svg]:flex-none">
        <IconCornerDownRight aria-hidden />
        <span>{m.ui_timeline_handoffs({ count })}</span>
      </p>
    ))
    .otherwise(() => visibleLinks.map((link) => {
      const isIncoming = link.targetSpan === span.id && link.to === span.row;
      const other = model.agents[isIncoming ? link.from : link.to];
      const name = other.name.toLowerCase();
      const text = isIncoming ? m.ui_timeline_from({ name }) : m.ui_timeline_to({ name });

      return (
        <p className="mt-0.5 mb-0 flex items-start gap-1.5 text-xs text-muted-foreground [&_svg]:mt-[1.5px] [&_svg]:size-[13px] [&_svg]:flex-none" key={link.id}>
          {isIncoming ? <IconCornerDownRight aria-hidden /> : <IconCornerUpLeft aria-hidden />}
          <span>{link.handoff.label ? `${text}: ${link.handoff.label}` : text}</span>
        </p>
      );
    }));

  return (
    <motion.div
      animate={{ opacity: 1, transition: AGENT_TIMELINE.card.enter }}
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 z-20 w-[min(280px,calc(100%-16px))]"
      exit={{ opacity: 0, transition: AGENT_TIMELINE.card.exit }}
      initial={{ opacity: 0 }}
      style={{ x, y }}
    >
      <motion.div style={{ y: shift }}>
        <motion.div
          animate={{ y: 0 }}
          className="relative box-content overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-lg"
          initial={isReduced ? false : { y: 3 }}
          style={{ height }}
          transition={AGENT_TIMELINE.card.smooth}
        >
          <div ref={content}>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                animate={{ opacity: 1, transition: AGENT_TIMELINE.card.enter }}
                className="grid gap-[3px] px-3.5 py-3"
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                initial={{ opacity: 0 }}
                key={span.id}
              >
                <p className="m-0 flex min-w-0 items-center gap-1.5 text-xs" style={headStyle}>
                  <span className="size-2 flex-none rounded-full bg-(--c)" />
                  <span className="flex-none">{agent.name}</span>
                  {agent.model ? <span className="truncate text-muted-foreground/70">{agent.model}</span> : null}
                </p>
                <p className="m-0">{span.label}</p>
                <p className="mt-0.5 mb-0 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                  {span.tool ? (
                    <span className="inline-flex items-center gap-[5px]">
                      <span className="inline-grid size-3 flex-none text-muted-foreground [&>svg]:size-full">{span.tool.mark ?? <IconWrench aria-hidden />}</span>
                      {span.tool.name}
                    </span>
                  ) : <span>{kind}</span>}
                  <span className="text-muted-foreground/70">·</span>
                  <span className="tabular-nums">{isDone ? agentTimelineDuration(elapsed) : m.ui_timeline_so_far({ duration: agentTimelineDuration(elapsed) })}</span>
                  {span.tokens ? (
                    <>
                      <span className="text-muted-foreground/70">·</span>
                      <span className="tabular-nums">{m.ui_timeline_tokens({ count: agentTimelineTokens(span.tokens) })}</span>
                    </>
                  ) : null}
                </p>
                {isFailed ? (
                  <p className="mt-0.5 mb-0 flex items-start gap-1.5 text-xs text-destructive [&_svg]:mt-[1.5px] [&_svg]:size-[13px] [&_svg]:flex-none">
                    <IconCircleX aria-hidden />
                    <span>{span.detail ? m.ui_timeline_failed_detail({ detail: span.detail }) : m.ui_timeline_failed()}</span>
                  </p>
                ) : null}
                {!isFailed && span.detail && isDone ? (
                  <p className="mt-0.5 mb-0 flex items-start gap-1.5 text-xs text-muted-foreground [&_svg]:mt-[1.5px] [&_svg]:size-[13px] [&_svg]:flex-none">
                    {span.retry ? <IconRotateCw aria-hidden /> : null}
                    <span>{span.detail}</span>
                  </p>
                ) : null}
                {handoffs}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
