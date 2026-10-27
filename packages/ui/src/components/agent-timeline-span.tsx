import { m } from '@repo/i18n/client';
import { match } from 'ts-pattern';
import IconCircleX from '~icons/lucide/circle-x';
import IconRotateCw from '~icons/lucide/rotate-cw';
import { agentTimelineSeconds, agentTimelineTokens } from '../services/agent-timeline/agent-timeline.utils';
import type { AgentTimelineBar, AgentTimelineStyle } from '../types/agent-timeline.types';
import type { KeyboardEvent } from 'react';

interface AgentTimelineSpanProps {
  span: AgentTimelineBar
  agentName: string
  isActive: boolean
  isDim: boolean
  isPinned: boolean
  isTabbable: boolean
  hasIcon: boolean
  onHover: (id: string) => void
  onLeave: () => void
  onFocusSpan: (id: string, isKeyboard: boolean) => void
  onBlurSpan: () => void
  onPick: (id: string) => void
  onKey: (event: KeyboardEvent<HTMLButtonElement>, span: AgentTimelineBar) => void
}

export function AgentTimelineSpan({
  span,
  agentName,
  isActive,
  isDim,
  isPinned,
  isTabbable,
  hasIcon,
  onHover,
  onLeave,
  onFocusSpan,
  onBlurSpan,
  onPick,
  onKey,
}: AgentTimelineSpanProps) {
  const isFailed = span.status === 'failed' && !isActive;

  const kind = match(span.kind)
    .with('thinking', () => m.ui_timeline_thinking())
    .with('tool', () => m.ui_timeline_tool())
    .with('waiting', () => m.ui_timeline_waiting())
    .exhaustive();

  const time = span.isOpen
    ? m.ui_timeline_span_open({ start: agentTimelineSeconds(span.start) })
    : m.ui_timeline_span_range({ start: agentTimelineSeconds(span.start), end: agentTimelineSeconds(span.end) });

  const parts = [
    span.tool ? `${kind}, ${span.tool.name}` : kind,
    isFailed ? m.ui_timeline_failed() : null,
  ].filter(Boolean).join(', ');

  const tokens = span.tokens ? `, ${m.ui_timeline_tokens({ count: agentTimelineTokens(span.tokens) })}` : '';

  const style: AgentTimelineStyle = {
    '--s': span.start,
    '--d': span.isOpen ? 1e5 : span.end - span.start,
  };

  const icon = match({ isFailed, isRetry: Boolean(span.retry) })
    .with({ isFailed: true }, () => <IconCircleX aria-hidden className="size-[11px] animate-timeline-appear motion-reduce:animate-none" />)
    .with({ isRetry: true }, () => <IconRotateCw aria-hidden className="size-[11px] animate-timeline-appear motion-reduce:animate-none" />)
    .otherwise(() => null);

  return (
    <button
      aria-label={`${m.ui_timeline_span_label({
        agent: agentName,
        kind: parts,
        label: span.label,
        time,
      })}${tokens}`}
      aria-pressed={isPinned}
      className={[
        '[--fill:color-mix(in_oklab,var(--c)_var(--tint),var(--card))] pointer-events-auto absolute top-[calc((var(--row)_-_var(--bar))_/_2)]',
        'left-[calc(var(--s)_/_var(--axis)_*_100%_+_.75px)] grid h-(--bar) place-items-center overflow-hidden rounded-[5px] bg-(--fill) p-0 text-card',
        'w-[max(0px,calc(clamp(0,var(--now)_-_var(--s),var(--d))_/_var(--axis)_*_100%_-_1.5px))] cursor-pointer [-webkit-tap-highlight-color:transparent]',
        'transition-[opacity,background-color,box-shadow,border-radius] duration-150 ease-(--ease-out-quint) motion-reduce:transition-none',
        'data-[kind=tool]:[--fill:var(--c)]',
        'data-[kind=waiting]:[background:repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--c)_30%,transparent)_0_1px,transparent_1px_5px),color-mix(in_oklab,var(--c)_5%,var(--card))]',
        'data-[kind=waiting]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--c)_24%,transparent)]',
        'data-[state=active]:rounded-ee-[1.5px] data-[state=active]:rounded-se-[1.5px] data-[state=active]:shadow-[inset_-2px_0_0_var(--c)]',
        'data-[kind=tool]:data-[state=active]:shadow-[inset_-2px_0_0_color-mix(in_oklab,var(--c)_70%,var(--foreground))]',
        'data-[kind=waiting]:data-[state=active]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--c)_24%,transparent),inset_-2px_0_0_var(--c)]',
        'data-[state=active]:not-data-[kind=waiting]:after:absolute data-[state=active]:not-data-[kind=waiting]:after:inset-0',
        'data-[state=active]:not-data-[kind=waiting]:after:[background:linear-gradient(90deg,transparent,var(--shine),transparent)_0_0/28px_100%_no-repeat]',
        'data-[state=active]:not-data-[kind=waiting]:after:animate-timeline-shine motion-reduce:after:hidden',
        'data-failed:bg-[color-mix(in_oklab,var(--destructive)_14%,var(--card))] data-failed:text-destructive',
        'data-failed:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--destructive)_55%,transparent)]',
        'data-dim:opacity-30',
        'hover:[--fill:color-mix(in_oklab,var(--c)_calc(var(--tint)_+_10%),var(--card))] data-[kind=tool]:hover:[--fill:color-mix(in_oklab,var(--c)_86%,var(--foreground))]',
      ].join(' ')}
      data-dim={isDim || undefined}
      data-failed={isFailed || undefined}
      data-kind={span.kind}
      data-span-id={span.id}
      data-state={isActive ? 'active' : 'done'}
      style={style}
      tabIndex={isTabbable ? 0 : -1}
      type="button"
      onBlur={onBlurSpan}
      onClick={() => onPick(span.id)}
      onFocus={(event) => onFocusSpan(span.id, event.currentTarget.matches(':focus-visible'))}
      onKeyDown={(event) => onKey(event, span)}
      onPointerEnter={(event) => (event.pointerType === 'mouse' ? onHover(span.id) : undefined)}
      onPointerLeave={(event) => (event.pointerType === 'mouse' ? onLeave() : undefined)}
    >
      {!isActive && hasIcon ? icon : null}
    </button>
  );
}
