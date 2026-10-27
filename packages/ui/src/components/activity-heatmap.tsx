import { m } from '@repo/i18n/client';
import { getLocale } from '@repo/i18n/runtime';
import { useHydrated } from '@tanstack/react-router';
import { useInView, useReducedMotion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import { cn } from '../lib/cn';
import { ACTIVITY_HEATMAP } from '../services/activity-heatmap/activity-heatmap.constants';
import {
  activityHeatmapColumn,
  activityHeatmapDirection,
  activityHeatmapIso,
  activityHeatmapModel,
} from '../services/activity-heatmap/activity-heatmap.utils';
import { chartClamp } from '../services/chart/chart.utils';
import { ActivityHeatmapTip } from './activity-heatmap-tip';
import { TextSwap } from './text-swap';
import type * as ActivityHeatmapTypes from '../types/activity-heatmap.types';
import type { FocusEvent, KeyboardEvent, PointerEvent } from 'react';

interface ActivityHeatmapProps {
  days: ActivityHeatmapTypes.ActivityHeatmapDay[]
  title?: string
  caption?: string
}

const activityHeatmapCell = cn(
  'block size-(--cell) flex-none cursor-default rounded-[calc(var(--cell)*.28)] bg-(--level-0) outline-[1.5px] outline-offset-1 outline-transparent [-webkit-tap-highlight-color:transparent]',
  'data-dim:opacity-20 data-empty:scale-0 data-[level=1]:bg-(--level-1) data-[level=2]:bg-(--level-2) data-[level=3]:bg-(--level-3) data-[level=4]:bg-(--level-4)',
  '[transition:background-color_320ms_var(--ease-standard)_var(--delay),transform_580ms_var(--ease-spring)_var(--delay),opacity_160ms_var(--ease-standard)]',
  'group-data-[reveal=hidden]/grid:scale-50 group-data-[reveal=hidden]/grid:opacity-0 group-data-[reveal=hidden]/grid:transition-none group-data-[reveal=hidden]/grid:data-empty:scale-0',
  'group-data-[reveal=revealing]/grid:[transition:background-color_320ms_var(--ease-standard)_var(--delay),transform_580ms_var(--ease-spring)_var(--delay),opacity_360ms_var(--ease-enter)_var(--delay)]',
  'hover:not-data-empty:outline-foreground/45 focus-visible:outline-foreground',
  'motion-reduce:[transition:background-color_160ms_var(--ease-standard),opacity_160ms_var(--ease-standard)] motion-reduce:group-data-[reveal=hidden]/grid:scale-100 motion-reduce:data-empty:scale-100 motion-reduce:data-empty:opacity-0',
);

export function ActivityHeatmap({ days, title, caption }: ActivityHeatmapProps) {
  const isHydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const isReduced = isHydrated && Boolean(prefersReduced);
  const uid = useId();
  const locale = getLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(plotRef, { once: true, amount: 0.35 });
  const { day, week, wave } = ACTIVITY_HEATMAP;

  const model = activityHeatmapModel(days, locale);

  const longDate = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const shortDate = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const weekdayName = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  const number = new Intl.NumberFormat(locale);

  const [range, setRange] = useState({ start: model.start, direction: 1 });

  if (range.start !== model.start) {
    setRange({ start: model.start, direction: model.start > range.start ? 1 : -1 });
  }

  const [reveal, setReveal] = useState<'hidden' | 'revealing' | 'done'>('hidden');

  useEffect(() => {
    if (reveal !== 'hidden' || !(isInView || isReduced)) {
      return;
    }

    const frame = requestAnimationFrame(() => setReveal(isReduced ? 'done' : 'revealing'));

    return () => cancelAnimationFrame(frame);
  }, [isInView, isReduced, reveal]);

  useEffect(() => {
    if (reveal !== 'revealing') {
      return;
    }

    const timer = window.setTimeout(() => setReveal('done'), wave + ACTIVITY_HEATMAP.revealTail);

    return () => window.clearTimeout(timer);
  }, [reveal, wave]);

  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const tabIndexDay = focusIndex !== null && focusIndex < model.length ? focusIndex : model.length - 1;

  const [preview, setPreview] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [legendFocus, setLegendFocus] = useState(0);
  const previewTimer = useRef(0);
  const highlight = preview ?? pinned;

  const previewLevel = (level: number | null) => {
    window.clearTimeout(previewTimer.current);

    if (level === null) {
      previewTimer.current = window.setTimeout(() => setPreview(null), ACTIVITY_HEATMAP.previewDelay);
    } else {
      setPreview(level);
    }
  };

  useEffect(() => () => window.clearTimeout(previewTimer.current), []);

  const [tip, setTip] = useState<ActivityHeatmapTypes.ActivityHeatmapTip | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [change, setChange] = useState<ActivityHeatmapTypes.ActivityHeatmapChange>('instant');
  const hideTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const valueText = (value: number) => (value > 0 ? number.format(value) : m.ui_heatmap_none());

  const contentFor = (index: number, anchor: HTMLElement): ActivityHeatmapTypes.ActivityHeatmapTip => {
    const value = model.values[index];
    const time = model.start + index * day;

    return { key: activityHeatmapIso(time), primary: valueText(value), secondary: shortDate.format(time), value, anchor };
  };

  const [a, b, c] = model.thresholds;

  const ranges = [
    m.ui_heatmap_level_none(),
    a === 1 ? number.format(1) : m.ui_heatmap_level_range({ from: number.format(1), to: number.format(a) }),
    m.ui_heatmap_level_range({ from: number.format(a + 1), to: number.format(b) }),
    m.ui_heatmap_level_range({ from: number.format(b + 1), to: number.format(c) }),
    m.ui_heatmap_level_from({ from: number.format(c + 1) }),
  ];

  const dayCount = highlight === null
    ? ''
    : match(model.perLevel[highlight])
      .with(1, () => m.ui_heatmap_day())
      .otherwise((count) => m.ui_heatmap_days({ count: number.format(count) }));

  const highlightCaption = highlight === null ? '' : m.ui_heatmap_days_with({ days: dayCount, range: ranges[highlight] });

  const show = (next: ActivityHeatmapTypes.ActivityHeatmapTip) => {
    window.clearTimeout(hideTimer.current);
    setChange(tip && isOpen ? activityHeatmapDirection(next.value - tip.value) : 'instant');
    setTip(next);
    setIsOpen(true);
  };

  const hideSoon = (delay: number) => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setIsOpen(false), delay);
  };

  const cellOf = (target: EventTarget | null) => {
    const cell = target instanceof Element ? target.closest<HTMLElement>('[data-index]') : null;

    return cell && gridRef.current?.contains(cell) ? { cell, index: Number(cell.dataset.index) } : null;
  };

  const focusDay = (index: number) => gridRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.focus();

  const onGridPointerOver = (event: PointerEvent<HTMLTableElement>) => {
    const hit = cellOf(event.target);

    if (hit) {
      show(contentFor(hit.index, hit.cell));
    }
  };

  const onGridPointerLeave = (event: PointerEvent<HTMLTableElement>) => {
    const focused = cellOf(document.activeElement);

    if (focused?.cell.matches(':focus-visible')) {
      show(contentFor(focused.index, focused.cell));
    } else {
      hideSoon(event.pointerType === 'touch' ? ACTIVITY_HEATMAP.touchHideDelay : ACTIVITY_HEATMAP.hideDelay);
    }
  };

  const onGridFocus = (event: FocusEvent<HTMLTableElement>) => {
    const hit = cellOf(event.target);

    if (!hit) {
      return;
    }

    setFocusIndex(hit.index);
    show(contentFor(hit.index, hit.cell));
  };

  const onGridBlur = (event: FocusEvent<HTMLTableElement>) => {
    if (!(event.relatedTarget instanceof Node && gridRef.current?.contains(event.relatedTarget))) {
      hideSoon(0);
    }
  };

  const onGridKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const hit = cellOf(event.target);

    if (!hit) {
      return;
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setIsOpen(false);

      return;
    }

    const next = match(event.key)
      .with('ArrowUp', () => hit.index - 1)
      .with('ArrowDown', () => hit.index + 1)
      .with('ArrowLeft', () => hit.index - week)
      .with('ArrowRight', () => hit.index + week)
      .with('Home', () => 0)
      .with('End', () => model.length - 1)
      .otherwise(() => null);

    if (next === null) {
      return;
    }

    event.preventDefault();
    focusDay(chartClamp(next, 0, model.length - 1));
  };

  const onLegendKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      previewLevel(null);
      return;
    }

    const next = match(event.key)
      .with('ArrowLeft', () => legendFocus - 1)
      .with('ArrowRight', () => legendFocus + 1)
      .with('Home', () => 0)
      .with('End', () => ACTIVITY_HEATMAP.levels.length - 1)
      .otherwise(() => null);

    if (next === null) {
      return;
    }

    event.preventDefault();
    rootRef.current?.querySelector<HTMLElement>(`[data-level-key="${chartClamp(next, 0, ACTIVITY_HEATMAP.levels.length - 1)}"]`)?.focus();
  };

  const maxDiagonal = Math.max(1, model.weeks - 1 + 6);
  const step = Math.min(ACTIVITY_HEATMAP.waveStep, wave / maxDiagonal);
  const rootStyle: ActivityHeatmapTypes.ActivityHeatmapStyle = { ...ACTIVITY_HEATMAP.colors };
  const canvasStyle: ActivityHeatmapTypes.ActivityHeatmapStyle = { ...ACTIVITY_HEATMAP.canvas, '--weeks': model.weeks };

  const weekdayLabels = Array.from({ length: week }, (_, row) => (row % 2 === 1 ? weekdayName.format((3 + row) * day) : ''));
  const totalText = m.ui_heatmap_total({ count: number.format(model.total) });

  return (
    <div className="@container relative grid min-w-0 gap-4 text-foreground" ref={rootRef} style={rootStyle}>
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-3 text-sm leading-[1.4]">
        {title ? <p className="m-0 min-w-0 font-medium">{title}</p> : null}
        <p className="m-0 text-muted-foreground tabular-nums">
          <TextSwap direction={range.direction} isReduced={isReduced} text={totalText} />
        </p>
      </div>

      <div className="flex min-w-0 gap-(--gap)" style={canvasStyle}>
        <div aria-hidden className="grid w-(--label) flex-none grid-rows-[repeat(7,var(--cell))] gap-y-(--gap) pt-6 text-xs text-muted-foreground/80">
          {weekdayLabels.map((text, row) => (
            <span className="flex h-(--cell) items-center leading-none whitespace-nowrap" key={row}>{text}</span>
          ))}
        </div>
        <div
          className="-m-1.5 scrollbar min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain p-1.5 [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] [direction:rtl] scrollbar-h-1 scrollbar-thumb-rounded-full"
          ref={scrollerRef}
        >
          <div className="grid w-max min-w-full grid-rows-[auto_auto] gap-y-2 [direction:ltr]">
            <div aria-hidden className="relative h-4 text-xs leading-4 text-muted-foreground/80">
              {model.months.map((month) => (
                <span
                  className="absolute top-0 left-0 translate-x-[calc(var(--col)*var(--step))] whitespace-nowrap [transition:transform_580ms_var(--ease-spring)] motion-reduce:transition-none"
                  key={month.key}
                  style={activityHeatmapColumn(month.col)}
                >
                  {month.label}
                </span>
              ))}
            </div>
            <div className="relative" ref={plotRef}>
              <table
                aria-describedby={`${uid}-legend`}
                aria-label={title ?? m.ui_heatmap_label()}
                aria-readonly
                className="group/grid grid border-collapse gap-(--gap) outline-none"
                data-reveal={reveal}
                ref={gridRef}
                // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role -- the ARIA grid pattern on a table: rows and cells keep table semantics while arrow keys move between days
                role="grid"
                tabIndex={-1}
                onBlur={onGridBlur}
                onFocus={onGridFocus}
                onKeyDown={onGridKeyDown}
                onPointerLeave={onGridPointerLeave}
                onPointerOver={onGridPointerOver}
              >
                <tbody className="contents">
                  {weekdayLabels.map((_, row) => (
                    <tr className="flex gap-(--gap)" key={row}>
                      {Array.from({ length: model.weeks }, (__, col) => {
                        const index = col * week + row - model.lead;
                        const delay = range.direction < 0 ? (maxDiagonal - col - row) * step : (col + row) * step;
                        const style: ActivityHeatmapTypes.ActivityHeatmapStyle = { '--delay': `${Math.round(delay)}ms` };

                        if (index < 0 || index >= model.length) {
                          return <td aria-hidden className={activityHeatmapCell} data-empty key={col} style={style} />;
                        }

                        const time = model.start + index * day;
                        const level = model.levels[index];

                        return (
                          <td
                            aria-label={m.ui_heatmap_cell({ value: valueText(model.values[index]), date: longDate.format(time) })}
                            className={activityHeatmapCell}
                            data-dim={(highlight !== null && highlight !== level) || undefined}
                            data-index={index}
                            data-level={level}
                            key={col}
                            style={style}
                            tabIndex={index === tabIndexDay ? 0 : -1}
                          />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-between gap-3 text-xs text-muted-foreground/80">
        <span className="sr-only" id={`${uid}-legend`}>{m.ui_heatmap_legend_description({ levels: ranges.join(', ') })}</span>
        <span aria-live="polite" className="relative min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground tabular-nums">
          <span aria-hidden>
            <TextSwap isReduced={isReduced} text={highlight === null ? caption ?? '' : highlightCaption} />
          </span>
          <span className="sr-only">{highlightCaption}</span>
        </span>
        <span className="flex flex-none items-center gap-2">
          <span aria-hidden className="leading-none">{m.ui_heatmap_less()}</span>
          <fieldset aria-label={m.ui_heatmap_levels()} className="m-0 flex min-w-0 border-0 p-0">
            {ACTIVITY_HEATMAP.levels.map((level) => (
              <button
                aria-label={m.ui_heatmap_highlight({ range: ranges[level] })}
                aria-pressed={pinned === level}
                className={cn(
                  'relative grid h-5 w-[15px] cursor-pointer place-items-center rounded-sm p-0 [-webkit-tap-highlight-color:transparent] aria-pressed:shadow-[inset_0_0_0_1.5px_var(--foreground)]',
                  'before:size-[11px] before:rounded-[3px] before:bg-(--level-0) data-[level=1]:before:bg-(--level-1) data-[level=2]:before:bg-(--level-2) data-[level=3]:before:bg-(--level-3) data-[level=4]:before:bg-(--level-4)',
                )}
                data-level={level}
                data-level-key={level}
                key={level}
                tabIndex={level === legendFocus ? 0 : -1}
                type="button"
                onBlur={() => previewLevel(null)}
                onClick={() => setPinned((current) => (current === level ? null : level))}
                onFocus={() => {
                  setLegendFocus(level);
                  previewLevel(level);
                }}
                onKeyDown={onLegendKeyDown}
                onPointerEnter={() => previewLevel(level)}
                onPointerLeave={() => previewLevel(null)}
              />
            ))}
          </fieldset>
          <span aria-hidden className="leading-none">{m.ui_heatmap_more()}</span>
        </span>
      </div>

      <ActivityHeatmapTip change={change} isOpen={isOpen} isReduced={isReduced} rootRef={rootRef} scrollerRef={scrollerRef} tip={tip} />
    </div>
  );
}
