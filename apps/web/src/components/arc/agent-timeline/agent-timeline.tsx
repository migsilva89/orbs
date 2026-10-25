/* oxlint-disable */
// fallow-ignore-file
"use client";

import { Fragment, memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode, RefObject } from "react";
import { AnimatePresence, animate, useInView, useMotionValue, useReducedMotion } from "motion/react";
import * as motion from "motion/react-m";
import { Bot, CircleCheck, CircleX, CornerDownRight, CornerUpLeft, Pause, Play, RotateCcw, RotateCw, Wrench } from "lucide-react";
import { Button } from "../button/button";
import SegmentedControl from "../segmented-control/segmented-control";
import { TextShimmer } from "../text-shimmer/text-shimmer";
import { motionTokens } from "../lib/motion-tokens";
import { sampleRun } from "./agent-timeline-data";
import { ClaudeMark, GeminiMark, GithubMark, GoogleMark, NotionMark, OpenaiMark, PostgresqlMark } from "./agent-timeline-marks";
import { buildModel, formatCost, formatDuration, formatSeconds, formatTick, formatTokens, liveAxis, pathFor, progressAt, tickStep } from "./agent-timeline-model";
import type { AgentTimelineAgent, AgentTimelineHandoff, AgentTimelineRun, AgentTimelineSpan, AgentTimelineTool, TimelineAgent, TimelineConnector, TimelineModel, TimelineSpan } from "./agent-timeline-model";

export type { AgentTimelineAgent, AgentTimelineHandoff, AgentTimelineRun, AgentTimelineSpan, AgentTimelineSpanKind, AgentTimelineTool } from "./agent-timeline-model";
export { sampleRun as agentTimelineSampleRun } from "./agent-timeline-data";

const styles = {
  root: "relative @container w-full min-w-0 border border-(color:--border) rounded-(--radius-surface) bg-(--surface) text-(--foreground) text-[length:var(--text-sm)] leading-(--leading-body) tracking-(--tracking-body) [--tint:24%] [--shine:color-mix(in_oklab,var(--background)_62%,transparent)] dark:[--tint:34%] dark:[--shine:color-mix(in_oklab,var(--foreground)_22%,transparent)]",
  inner: "[--gutter:var(--space-6)] [--label-w:176px] [--plot-min:320px] grid min-w-0 gap-(--space-4) py-(--space-5) @max-[520px]:[--gutter:var(--space-4)] @max-[520px]:[--label-w:132px] @max-[520px]:[--plot-min:300px]",
  header: "grid min-w-0 gap-[2px] px-(--gutter)",
  title: "m-0 text-(--foreground) text-[length:var(--text-base)] font-medium leading-(--leading-body) tracking-(--tracking-body)",
  status: "grid min-w-0 text-(--text-secondary)",
  layer: "[grid-area:1/1] min-w-0 m-0 opacity-0 invisible [transition:opacity_100ms_var(--ease-standard),visibility_0s_linear_100ms] data-on:opacity-100 data-on:visible data-on:[transition:opacity_var(--duration-fast)_var(--ease-enter),visibility_0s] motion-reduce:transition-none",
  word: "inline-grid text-(--foreground)",
  part: "text-(--foreground) whitespace-nowrap",
  unit: "text-(--text-secondary)",
  wordItem: "[grid-area:1/1] opacity-0 [transition:opacity_100ms_var(--ease-standard)] data-on:opacity-100 data-on:[transition:opacity_var(--duration-fast)_var(--ease-enter)] motion-reduce:transition-none",
  count: "inline-grid justify-items-end tabular-nums whitespace-nowrap *:[grid-area:1/1]",
  countSizer: "invisible",
  countValue: "text-(--foreground)",
  sep: "text-(--text-muted)",
  tabular: "tabular-nums",
  doneIcon: "inline-block size-4 mr-1.5 text-(--success) align-[-3px]",

  scroller: "group/scroller min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]",
  body: "grid min-w-0 grid-cols-[var(--label-w)_minmax(calc(var(--plot-min)_+_12px_+_var(--gutter)),1fr)]",
  labels: "arc-timeline-labels sticky left-0 z-6 min-w-0 pt-(--pad) pr-(--space-3) pb-(--axis-h) pl-(--gutter) bg-(--surface) [transition:box-shadow_var(--duration-fast)_var(--ease-standard)] group-data-scrolled/scroller:shadow-[1px_0_0_var(--border)]",
  label: "grid h-(--row) min-w-0 grid-cols-[8px_minmax(0,1fr)] [grid-template-areas:'dot_name'_'._model'] content-center items-center gap-x-[10px] @max-[520px]:[grid-template-areas:'dot_name']",
  labelText: "contents",
  dot: "[grid-area:dot] size-2 flex-none rounded-full bg-(--c)",
  name: "[grid-area:name] overflow-hidden text-(--foreground) font-medium text-ellipsis whitespace-nowrap",
  model: "[grid-area:model] flex min-w-0 items-center gap-[5px] text-(--text-muted) text-[length:var(--text-xs)] @max-[520px]:hidden",
  modelName: "overflow-hidden text-ellipsis whitespace-nowrap",
  mark: "inline-grid size-3 flex-none text-(--text-secondary) [&>svg]:size-full",

  track: "min-w-0 py-0 pr-(--gutter) pl-3",
  plot: "group/plot relative h-[calc(var(--rows-h)_+_var(--axis-h))]",
  grid: "absolute inset-x-0 top-0 bottom-(--axis-h) pointer-events-none",
  gridline: "absolute inset-y-0 w-px -ml-[.5px] bg-(--border-subtle)",

  row: "absolute inset-x-0 z-2 h-(--row) pointer-events-none",
  span: [
    "[--fill:color-mix(in_oklab,var(--c)_var(--tint),var(--surface))] absolute top-[calc((var(--row)_-_var(--bar))_/_2)] left-[calc(var(--s)_/_var(--axis)_*_100%_+_.75px)] grid",
    "w-[max(0px,calc(clamp(0,var(--now)_-_var(--s),var(--d))_/_var(--axis)_*_100%_-_1.5px))] h-(--bar) place-items-center overflow-hidden p-0 border-0 rounded-[5px] bg-(--fill) text-(--surface)",
    "cursor-pointer pointer-events-auto [-webkit-tap-highlight-color:transparent]",
    "[transition:opacity_var(--duration-fast)_var(--ease-standard),background-color_var(--duration-fast)_var(--ease-standard),box-shadow_var(--duration-fast)_var(--ease-standard),border-radius_var(--duration-fast)_var(--ease-standard)]",
    "data-[kind=tool]:[--fill:var(--c)]",
    "data-[kind=waiting]:[background:repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--c)_30%,transparent)_0_1px,transparent_1px_5px),color-mix(in_oklab,var(--c)_5%,var(--surface))]",
    "data-[kind=waiting]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--c)_24%,transparent)]",
    "data-[state=active]:rounded-se-[1.5px] data-[state=active]:rounded-ee-[1.5px] data-[state=active]:shadow-[inset_-2px_0_0_var(--c)]",
    "data-[kind=tool]:data-[state=active]:shadow-[inset_-2px_0_0_color-mix(in_oklab,var(--c)_70%,var(--foreground))]",
    "data-[kind=waiting]:data-[state=active]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--c)_24%,transparent),inset_-2px_0_0_var(--c)]",
    "data-[state=active]:not-data-[kind=waiting]:after:absolute data-[state=active]:not-data-[kind=waiting]:after:inset-0",
    "data-[state=active]:not-data-[kind=waiting]:after:[background:linear-gradient(90deg,transparent,var(--shine),transparent)_0_0/28px_100%_no-repeat]",
    "data-[state=active]:not-data-[kind=waiting]:after:animate-[arc-timeline-shine_1.5s_var(--ease-in-out)_infinite] motion-reduce:after:hidden",
    "data-failed:bg-[color-mix(in_oklab,var(--danger)_14%,var(--surface))] data-failed:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--danger)_55%,transparent)] data-failed:text-(--danger)",
    "data-dim:opacity-[.28]",
    "hover:[--fill:color-mix(in_oklab,var(--c)_calc(var(--tint)_+_10%),var(--surface))] data-[kind=tool]:hover:[--fill:color-mix(in_oklab,var(--c)_86%,var(--foreground))]",
    "motion-reduce:transition-none",
  ].join(" "),
  spanIcon: "size-[11px] animate-[arc-appear_var(--duration-fast)_var(--ease-enter)] motion-reduce:animate-none",

  links: "absolute inset-0 z-1 pointer-events-none",
  ports: "absolute inset-0 z-3 pointer-events-none",
  link: [
    "absolute box-border border-0 border-solid border-(color:--c) [transition:opacity_var(--duration-fast)_var(--ease-standard)]",
    "data-[shape=out]:data-[dir=down]:border-b-[1.5px] data-[shape=out]:data-[dir=down]:border-l-[1.5px] data-[shape=out]:data-[dir=down]:rounded-bl-[7px]",
    "data-[shape=out]:data-[dir=up]:border-t-[1.5px] data-[shape=out]:data-[dir=up]:border-l-[1.5px] data-[shape=out]:data-[dir=up]:rounded-tl-[7px]",
    "data-[shape=in]:data-[dir=up]:border-r-[1.5px] data-[shape=in]:data-[dir=up]:border-b-[1.5px] data-[shape=in]:data-[dir=up]:rounded-br-[7px]",
    "data-[shape=in]:data-[dir=down]:border-t-[1.5px] data-[shape=in]:data-[dir=down]:border-r-[1.5px] data-[shape=in]:data-[dir=down]:rounded-tr-[7px]",
    "data-[shape=line]:border-l-[1.5px]",
    "data-draw:data-[dir=down]:animate-[arc-timeline-draw-down_360ms_var(--ease-standard)_backwards] data-draw:data-[dir=up]:animate-[arc-timeline-draw-up_360ms_var(--ease-standard)_backwards]",
    "group-data-path/plot:not-data-hot:opacity-[.16] motion-reduce:animate-none motion-reduce:transition-none",
  ].join(" "),
  port: [
    "absolute size-[7px] -mt-[3.5px] -ml-[3.5px] rounded-full bg-(--c) shadow-[0_0_0_1.5px_var(--surface)] [transition:opacity_var(--duration-fast)_var(--ease-standard)]",
    "data-draw:animate-[arc-timeline-port-in_var(--duration-fast)_var(--ease-enter)_var(--delay)_backwards]",
    "group-data-path/plot:not-data-hot:opacity-[.16] motion-reduce:animate-none motion-reduce:transition-none",
  ].join(" "),

  playhead: "absolute z-4 top-0 left-[calc(min(var(--now),var(--axis))_/_var(--axis)_*_100%)] w-px h-(--rows-h) -ml-[.5px] bg-(--foreground) opacity-50 pointer-events-none [transition:opacity_var(--duration-standard)_var(--ease-standard)] data-settled:opacity-0 motion-reduce:transition-none",

  axis: "arc-timeline-axis group/axis absolute z-5 top-(--rows-h) inset-x-0 h-(--axis-h) border-t border-(color:--border) cursor-ew-resize touch-none select-none data-live:cursor-default",
  tick: "absolute top-[9px] text-(--text-muted) text-[length:var(--text-xs)] tabular-nums leading-none whitespace-nowrap -translate-x-1/2 pointer-events-none",
  knob: "absolute -top-px left-[calc(min(var(--now),var(--axis))_/_var(--axis)_*_100%)] size-[9px] -mt-[4.5px] -ml-[4.5px] rounded-full bg-(--foreground) shadow-[0_0_0_2px_var(--surface)] pointer-events-none [transition:scale_var(--duration-fast)_var(--ease-standard)] focus-visible:scale-130 data-active:scale-130 group-[:not([data-live]):hover]/axis:scale-130 motion-reduce:transition-none",

  footer: "flex min-w-0 flex-wrap items-center justify-between gap-y-(--space-3) gap-x-(--space-4) px-(--gutter)",
  controls: "flex items-center gap-1.5",
  iconButton: "w-(--control-height-sm) p-0! [&_svg]:size-4",
  glyph: "group/glyph grid size-4",
  glyphPlay: "[grid-area:1/1] translate-x-[.5px] [transition:opacity_var(--duration-fast)_var(--ease-standard)] group-data-playing/glyph:opacity-0 group-data-playing/glyph:[transition:opacity_100ms_var(--ease-standard)] motion-reduce:transition-none",
  glyphPause: "[grid-area:1/1] opacity-0 [transition:opacity_100ms_var(--ease-standard)] group-data-playing/glyph:opacity-100 group-data-playing/glyph:[transition:opacity_var(--duration-fast)_var(--ease-standard)] motion-reduce:transition-none",
  legend: "flex flex-wrap items-center gap-y-1 gap-x-[14px] m-0 p-0 text-(--text-secondary) text-[length:var(--text-xs)] list-none [&_li]:inline-flex [&_li]:items-center [&_li]:gap-1.5 [&_li]:whitespace-nowrap",
  swatch: [
    "[--c:var(--text-secondary)] w-[14px] h-2 rounded-[3px]",
    "data-[kind=thinking]:bg-[color-mix(in_oklab,var(--c)_28%,var(--surface))] data-[kind=tool]:bg-(--c)",
    "data-[kind=waiting]:[background:repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--c)_40%,transparent)_0_1px,transparent_1px_4px)]",
    "data-[kind=waiting]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--c)_30%,transparent)]",
  ].join(" "),
  legendIcon: "size-[13px] text-(--text-muted)",
  legendFailed: "size-[13px] text-(--danger)",

  cardLayer: "absolute z-20 top-0 left-0 w-[min(280px,calc(100%_-_16px))] pointer-events-none",
  card: "relative box-content overflow-hidden border border-(color:--border) rounded-(--radius-control) bg-(--surface-raised) shadow-(--shadow-floating)",
  cardBody: "grid gap-[3px] py-3 px-[14px]",
  cardHead: "flex min-w-0 items-center gap-1.5 m-0 text-[length:var(--text-xs)]",
  cardAgent: "flex-none text-(--foreground) font-medium",
  cardModel: "overflow-hidden text-(--text-muted) text-ellipsis whitespace-nowrap",
  cardLabel: "m-0 text-(--foreground)",
  cardMeta: "flex flex-wrap items-center gap-y-[2px] gap-x-1.5 mt-[2px] mx-0 mb-0 text-(--text-secondary) text-[length:var(--text-xs)]",
  cardTool: "inline-flex items-center gap-[5px]",
  cardNote: "flex items-start gap-1.5 mt-[2px] mx-0 mb-0 text-(--text-secondary) text-[length:var(--text-xs)] [&_svg]:size-[13px] [&_svg]:flex-none [&_svg]:mt-[1.5px]",
  cardFailed: "flex items-start gap-1.5 mt-[2px] mx-0 mb-0 text-(--danger) text-[length:var(--text-xs)] [&_svg]:size-[13px] [&_svg]:flex-none [&_svg]:mt-[1.5px]",

  srOnly: "sr-only",
};

/**
 * A compact timeline of one orchestrated agent run. Rows are agents, the orchestrator on top; spans show thinking, tool calls and
 * waiting on a shared time axis, and thin connectors show work handed to a subagent and results coming back. It replays live:
 * a playhead sweeps, spans grow, connectors draw in and the header counts time, tokens and cost until a summary settles.
 * Hover or focus a span for a card with what it did; click to pin it and trace its handoff path.
 */
export interface AgentTimelineProps {
  /** The run to show. Defaults to a sample incident investigation. */
  run?: AgentTimelineRun;
  /** Override the run's agents, spans or handoffs one by one. */
  agents?: AgentTimelineAgent[];
  spans?: AgentTimelineSpan[];
  handoffs?: AgentTimelineHandoff[];
  /** Heading. Defaults to the run's title. */
  title?: string;
  /** Replay from the start when the timeline scrolls into view. Defaults to true for the sample and false when you pass data,
   *  which renders the finished run. Reduced motion always starts finished. */
  autoPlay?: boolean;
  /** Starting playback speed. 1 is real time. */
  speed?: number;
  /** Speeds offered in the speed control. */
  speeds?: number[];
  /** Follow a run in progress: the clock runs from run.startedAt (or mount), spans without an end grow to now and the axis
   *  extends in steps. Append spans and handoffs to the run as events arrive; set live to false when the run ends. */
  live?: boolean;
  /** Called when a span is pinned or unpinned. */
  onSpanSelect?: (span: AgentTimelineSpan | null) => void;
  /** Called when a replay reaches the end or a live run ends. */
  onComplete?: () => void;
  className?: string;
  style?: CSSProperties;
}

/** Row geometry in pixels, shared by the label column, the plot and the connectors. */
const ROW = 44;
const BAR = 16;
const PAD = 6;
const AXIS = 30;
const LINE = 1.5;
const CARD_W = 280;
const CARD_EST = 120;

const center = (row: number) => PAD + row * ROW + ROW / 2;
const at = (seconds: number) => `${seconds} / var(--axis) * 100%`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const subscribe = () => () => {};

const NO_AGENTS: AgentTimelineAgent[] = [];
const NO_SPANS: AgentTimelineSpan[] = [];
const NO_HANDOFFS: AgentTimelineHandoff[] = [];

const KIND_LABEL = { thinking: "Thinking", tool: "Tool call", waiting: "Waiting" } as const;

function toolMark(tool: AgentTimelineTool): ReactNode {
  if (tool.mark) return tool.mark;
  const name = tool.name.toLowerCase();
  if (name.includes("github")) return <GithubMark />;
  if (name.includes("search") || name.includes("google")) return <GoogleMark style={{ color: "#4285F4" }} />;
  if (name.includes("postgres")) return <PostgresqlMark style={{ color: "#4169E1" }} />;
  if (name.includes("notion")) return <NotionMark />;
  return <Wrench aria-hidden="true" strokeWidth={1.75} />;
}

function modelMark(agent: TimelineAgent): ReactNode {
  if (agent.mark) return agent.mark;
  const model = (agent.model ?? "").toLowerCase();
  if (model.includes("claude")) return <ClaudeMark style={{ color: "#D97757" }} />;
  if (model.includes("gpt") || model.includes("openai")) return <OpenaiMark />;
  if (model.includes("gemini")) return <GeminiMark />;
  return <Bot aria-hidden="true" strokeWidth={1.75} />;
}

/** Elbow geometry for a connector: a box with two borders and one rounded corner, positioned in seconds on x and pixels on y. */
function linkStyle(link: TimelineConnector): CSSProperties {
  const top = (row: number) => center(row) - BAR / 2;
  const bottom = (row: number) => center(row) + BAR / 2;
  let y0: number, y1: number;
  if (link.shape === "out") [y0, y1] = link.up ? [center(link.to) - LINE / 2, top(link.from)] : [bottom(link.from), center(link.to) + LINE / 2];
  else if (link.shape === "in") [y0, y1] = link.up ? [bottom(link.to), center(link.from) + LINE / 2] : [center(link.from) - LINE / 2, top(link.to)];
  else [y0, y1] = link.up ? [bottom(link.to), top(link.from)] : [bottom(link.from), top(link.to)];
  const shiftLeft = link.shape === "in" ? 0 : LINE / 2;
  return {
    "--c": link.color,
    top: y0,
    height: Math.max(0, y1 - y0),
    left: `calc(${at(link.x0)} - ${shiftLeft}px)`,
    width: link.shape === "line" ? LINE : `calc(${at(link.x1 - link.x0)} + ${LINE / 2}px)`,
  } as CSSProperties;
}

function portStyle(link: TimelineConnector): CSSProperties {
  const row = link.shape === "in" ? link.to : link.from;
  const downward = link.shape === "in" ? !link.up : !link.up;
  const edge = link.shape === "in" ? (link.up ? center(row) + BAR / 2 : center(row) - BAR / 2) : (downward ? center(row) + BAR / 2 : center(row) - BAR / 2);
  return { "--c": link.color, top: edge, left: `calc(${at(link.at)})`, "--delay": link.shape === "in" ? "260ms" : "0ms" } as CSSProperties;
}

/** Play and pause crossfade in place; the button around them keeps one stable label so its own label motion never runs. */
function PlayGlyph({ playing }: { playing: boolean }) {
  return <span className={styles.glyph} data-playing={playing || undefined} aria-hidden="true">
    <Play className={styles.glyphPlay} fill="currentColor" strokeWidth={1.75} />
    <Pause className={styles.glyphPause} fill="currentColor" strokeWidth={1.75} />
  </span>;
}

/** A separator that stays with the item before it, so a wrapped line never starts with a dot. */
function Sep() {
  return <><span className={styles.sep} aria-hidden="true">{"\u00a0·"}</span>{" "}</>;
}

/** A counting number. Its box is sized by the run's final value and the digits sit right-aligned in it, so the line
 *  never shifts while the numbers grow. */
function Count({ value, reserve }: { value: string; reserve?: string }) {
  return <span className={styles.count}>
    {reserve && reserve.length > value.length ? <span className={styles.countSizer} aria-hidden="true">{reserve}</span> : null}
    <span className={styles.countValue}>{value}</span>
  </span>;
}

type SpanState = "active" | "done";

interface SpanButtonProps {
  span: TimelineSpan;
  agentName: string;
  state: SpanState;
  dim: boolean;
  pinned: boolean;
  tabbable: boolean;
  showIcon: boolean;
  onHover: (id: string) => void;
  onLeave: () => void;
  onFocusSpan: (id: string, visible: boolean) => void;
  onBlurSpan: () => void;
  onPick: (id: string) => void;
}

const SpanButton = memo(function SpanButton({ span, agentName, state, dim, pinned, tabbable, showIcon, onHover, onLeave, onFocusSpan, onBlurSpan, onPick }: SpanButtonProps) {
  const failed = span.status === "failed" && state === "done";
  const tool = span.toolInfo;
  const kind = tool ? `${KIND_LABEL[span.kind]}, ${tool.name}` : KIND_LABEL[span.kind];
  const time = span.open ? `from ${formatSeconds(span.start)}, still running` : `${formatSeconds(span.start)} to ${formatSeconds(span.end!)}`;
  const label = `${agentName}, ${kind}${failed ? ", failed" : ""}: ${span.label}, ${time}${span.tokens ? `, ${formatTokens(span.tokens)} tokens` : ""}`;
  return <button
    type="button"
    className={styles.span}
    data-kind={span.kind}
    data-state={state}
    data-failed={failed || undefined}
    data-dim={dim || undefined}
    data-span-id={span.id}
    aria-pressed={pinned}
    aria-label={label}
    tabIndex={tabbable ? 0 : -1}
    style={{ "--s": span.start, "--d": span.open ? 1e5 : span.end! - span.start } as CSSProperties}
    onPointerEnter={event => { if (event.pointerType === "mouse") onHover(span.id); }}
    onPointerLeave={event => { if (event.pointerType === "mouse") onLeave(); }}
    onFocus={event => onFocusSpan(span.id, event.currentTarget.matches(":focus-visible"))}
    onBlur={onBlurSpan}
    onClick={() => onPick(span.id)}
  >
    {state === "done" && showIcon && (failed ? <CircleX className={styles.spanIcon} aria-hidden="true" strokeWidth={2} /> : span.retry ? <RotateCw className={styles.spanIcon} aria-hidden="true" strokeWidth={2} /> : null)}
  </button>;
});

interface CardProps {
  span: TimelineSpan;
  model: TimelineModel;
  now: number;
  layoutKey: string;
  reduced: boolean;
  rootRef: RefObject<HTMLElement | null>;
  plotRef: RefObject<HTMLDivElement | null>;
  axisRef: RefObject<number>;
}

/** The floating span card. It glides between spans on a spring with no overshoot, crossfades its content and springs to its new height. */
function SpanCard({ span, model, now, layoutKey, reduced, rootRef, plotRef, axisRef }: CardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const shift = useMotionValue("0%");
  const height = useMotionValue<number | "auto">("auto");
  const placed = useRef<{ id: string; above: boolean } | null>(null);
  const content = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current, plot = plotRef.current;
    if (!root || !plot) return;
    const box = root.getBoundingClientRect(), area = plot.getBoundingClientRect();
    const width = Math.min(CARD_W, box.width - 16);
    const left = area.left - box.left + (span.start / Math.max(axisRef.current, .001)) * area.width;
    const barTop = area.top - box.top + center(span.row) - BAR / 2;
    const above = barTop - 10 - CARD_EST > 0;
    const nextX = clamp(left - 12, 8, box.width - width - 8);
    const nextY = above ? barTop - 8 : barTop + BAR + 8;
    const previous = placed.current;
    placed.current = { id: span.id, above };
    if (!previous || reduced || previous.above !== above || previous.id === span.id) {
      x.jump(nextX); y.jump(nextY); shift.jump(above ? "-100%" : "0%");
      return;
    }
    animate(x, nextX, { type: "spring", visualDuration: 0.26, bounce: 0 });
    animate(y, nextY, { type: "spring", visualDuration: 0.26, bounce: 0 });
  }, [span.id, span.start, span.row, layoutKey, reduced, rootRef, plotRef, axisRef, x, y, shift]);

  useEffect(() => {
    const node = content.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    let first = true;
    const observer = new ResizeObserver(([entry]) => {
      const next = entry?.borderBoxSize?.[0]?.blockSize ?? node.offsetHeight;
      if (first || reduced) { height.jump(next); first = false; return; }
      animate(height, next, motionTokens.spring.smooth);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [height, reduced]);

  const agent = model.agents[span.row];
  const tool = span.toolInfo;
  const done = span.open ? false : now >= span.end!;
  const failed = span.status === "failed" && done;
  const elapsed = span.open ? Math.max(0, now - span.start) : Math.min(now, span.end!) - span.start;
  const links = model.connectors.filter(link => (link.targetSpan === span.id && link.to === span.row) || (link.sourceSpan === span.id && link.from === span.row));
  const visibleLinks = links.filter(link => link.at <= now + .01);

  return <motion.div
    className={styles.cardLayer}
    style={{ x, y }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, transition: { duration: motionTokens.duration.fast, ease: [...motionTokens.ease.enter] } }}
    exit={{ opacity: 0, transition: { duration: motionTokens.duration.instant, ease: [...motionTokens.ease.standard] } }}
    aria-hidden="true"
  >
    <motion.div style={{ y: shift }}>
      <motion.div className={styles.card} style={{ height }} initial={reduced ? false : { y: 3 }} animate={{ y: 0 }} transition={motionTokens.spring.smooth}>
        <div ref={content}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={span.id}
              className={styles.cardBody}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: motionTokens.duration.fast, ease: [...motionTokens.ease.enter] } }}
              exit={{ opacity: 0, transition: { duration: .1 } }}
            >
              <p className={styles.cardHead} style={{ "--c": agent.color } as CSSProperties}>
                <span className={styles.dot} />
                <span className={styles.cardAgent}>{agent.name}</span>
                {agent.model && <span className={styles.cardModel}>{agent.model}</span>}
              </p>
              <p className={styles.cardLabel}>{span.label}</p>
              <p className={styles.cardMeta}>
                {tool ? <span className={styles.cardTool}><span className={styles.mark}>{toolMark(tool)}</span>{tool.name}</span> : <span>{KIND_LABEL[span.kind]}</span>}
                <span className={styles.sep}>·</span>
                <span className={styles.tabular}>{done ? formatDuration(elapsed) : `${formatDuration(elapsed)} so far`}</span>
                {span.tokens ? <><span className={styles.sep}>·</span><span className={styles.tabular}>{formatTokens(span.tokens)} tokens</span></> : null}
              </p>
              {failed && <p className={styles.cardFailed}><CircleX aria-hidden="true" strokeWidth={1.75} /><span>Failed{span.detail ? `: ${span.detail}` : ""}</span></p>}
              {!failed && span.detail && done && <p className={styles.cardNote}>{span.retry && <RotateCw aria-hidden="true" strokeWidth={1.75} />}<span>{span.detail}</span></p>}
              {visibleLinks.length > 0 && visibleLinks.length <= 2 && visibleLinks.map(link => {
                const incoming = link.targetSpan === span.id && link.to === span.row;
                const other = model.agents[incoming ? link.from : link.to];
                const Icon = incoming ? CornerDownRight : CornerUpLeft;
                return <p key={link.id} className={styles.cardNote}><Icon aria-hidden="true" strokeWidth={1.75} /><span>{incoming ? "From" : "To"} {other.name.toLowerCase()}{link.handoff.label ? `: ${link.handoff.label}` : ""}</span></p>;
              })}
              {visibleLinks.length > 2 && <p className={styles.cardNote}><CornerDownRight aria-hidden="true" strokeWidth={1.75} /><span>{visibleLinks.length} handoffs during this span</span></p>}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  </motion.div>;
}

export function AgentTimeline({
  run,
  agents: agentsProp,
  spans: spansProp,
  handoffs: handoffsProp,
  title,
  autoPlay: autoPlayProp,
  speed: speedProp = 1,
  speeds = [1, 2],
  live = false,
  onSpanSelect,
  onComplete,
  className,
  style,
}: AgentTimelineProps) {
  const source = run ?? (agentsProp || spansProp ? undefined : sampleRun);
  const agentsIn = agentsProp ?? source?.agents ?? NO_AGENTS;
  const spansIn = spansProp ?? source?.spans ?? NO_SPANS;
  const handoffsIn = handoffsProp ?? source?.handoffs ?? NO_HANDOFFS;
  const model = useMemo(() => buildModel(agentsIn, spansIn, handoffsIn, source?.duration), [agentsIn, spansIn, handoffsIn, source?.duration]);
  const duration = Math.max(model.duration, .001);
  const startedAt = source?.startedAt;
  const lastEnd = useMemo(() => Math.max(0, ...model.spans.map(span => span.end ?? span.start)), [model]);
  const heading = title ?? source?.title ?? "Agent run";
  const autoPlay = autoPlayProp ?? (run === undefined && agentsProp === undefined && spansProp === undefined);

  const uid = useId();
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const prefersReduced = useReducedMotion();
  const reduced = hydrated && !!prefersReduced;

  const rootRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef(autoPlay || live ? 0 : duration);
  const axisRef = useRef(live ? liveAxis(0, 0) : duration);
  const renderedAt = useRef(0);
  const speedRef = useRef(speedProp);
  const scrubRef = useRef<{ id: number } | null>(null);
  const followRef = useRef({ auto: 0, manualUntil: 0, plotLeft: 0, plotWidth: 360, labels: 0 });
  const leaveTimer = useRef(0);
  const liveStart = useRef(0);
  const finishedRef = useRef(!(autoPlay || live));

  const inView = useInView(rootRef, { amount: .2 });
  const [t, setT] = useState(() => (autoPlay || live ? 0 : duration));
  const [playing, setPlaying] = useState(autoPlay && !live);
  const [interacted, setInteracted] = useState(false);
  const [speed, setSpeed] = useState(speedProp);
  const [scrubbing, setScrubbing] = useState(false);
  const [axisState, setAxisState] = useState(() => (live ? liveAxis(0, 0) : duration));
  const [plotWidth, setPlotWidth] = useState(360);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [rovingId, setRovingId] = useState<string | null>(null);
  const [scrollTick, setScrollTick] = useState(0);
  const [wasLive, setWasLive] = useState(live);

  // A live run that ends settles on its final state in the same render.
  if (wasLive !== live) {
    setWasLive(live);
    if (!live) { setT(duration); setPlaying(false); setAxisState(duration); }
  }

  // Reduced motion holds the finished run until the person plays it themselves.
  const held = reduced && autoPlay && !interacted && !live;
  const shownT = held ? duration : live ? t : Math.min(t, duration);
  const axis = live ? axisState : duration;
  const done = !live && shownT >= duration - 1e-6;
  const running = (playing && !held) || live;

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  /** Moves the playhead. Bars and the playhead follow a CSS variable every frame; React renders about twenty times a second. */
  const commit = useCallback((next: number, force = false) => {
    timeRef.current = next;
    plotRef.current?.style.setProperty("--now", next.toFixed(3));
    const now = performance.now();
    if (force || now - renderedAt.current >= 48) { renderedAt.current = now; setT(next); }
  }, []);

  /** Keeps the playhead in view while the timeline scrolls inside its frame, unless the person just scrolled it themselves. */
  const follow = useCallback((time: number) => {
    const scroller = scrollerRef.current, state = followRef.current;
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth + 1 || performance.now() < state.manualUntil) return;
    const x = state.plotLeft + (time / Math.max(axisRef.current, .001)) * state.plotWidth;
    const view = scroller.clientWidth - state.labels;
    const target = clamp(x - state.labels - view * .62, 0, scroller.scrollWidth - scroller.clientWidth);
    if (target > scroller.scrollLeft + .5) { state.auto = target; scroller.scrollLeft = target; }
  }, []);

  // Replay clock.
  useEffect(() => {
    if (!playing || held || live || scrubbing || !inView) return;
    let frame = 0, last = performance.now();
    const step = (now: number) => {
      const dt = clamp((now - last) / 1000, 0, .1);
      last = now;
      const next = Math.min(duration, timeRef.current + dt * speedRef.current);
      commit(next, next >= duration);
      follow(next);
      if (next >= duration) { setPlaying(false); return; }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing, held, live, scrubbing, inView, duration, commit, follow]);

  // Live clock: real time since the run started, with an axis that eases out to its next step.
  useEffect(() => {
    if (!live) return;
    if (!liveStart.current) liveStart.current = Date.now();
    const origin = startedAt ?? liveStart.current;
    const plot = plotRef.current;
    let frame = 0, last = performance.now(), target = axisRef.current;
    const step = (now: number) => {
      const dt = clamp((now - last) / 1000, 0, .1);
      last = now;
      const time = Math.max(0, (Date.now() - origin) / 1000);
      const next = liveAxis(time, lastEnd);
      if (next !== target) { target = next; setAxisState(next); }
      const shown = reduced ? target : axisRef.current + (target - axisRef.current) * (1 - Math.exp(-dt * 7));
      axisRef.current = Math.abs(target - shown) < .005 ? target : shown;
      plot?.style.setProperty("--axis", axisRef.current.toFixed(3));
      commit(time);
      follow(time);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(frame); plot?.style.removeProperty("--axis"); };
  }, [live, startedAt, lastEnd, reduced, commit, follow]);

  useEffect(() => { if (!live) axisRef.current = duration; }, [live, duration]);

  // While the clock is stopped, the frame-level time follows React's (a live run that ended, a held finished run, new data).
  useLayoutEffect(() => {
    if (running || scrubbing) return;
    timeRef.current = shownT;
    plotRef.current?.style.setProperty("--now", shownT.toFixed(3));
  }, [running, scrubbing, shownT]);

  // Completion callback, once per finish.
  useEffect(() => {
    if (done && !finishedRef.current) { finishedRef.current = true; onComplete?.(); }
    if (!done) finishedRef.current = false;
  }, [done, onComplete]);

  // Plot measurements for ticks, the card and the follow scroll.
  useEffect(() => {
    const plot = plotRef.current, scroller = scrollerRef.current;
    if (!plot || !scroller || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const area = plot.getBoundingClientRect(), frame = scroller.getBoundingClientRect();
      const labels = scroller.querySelector<HTMLElement>(".arc-timeline-labels")?.offsetWidth ?? 0;
      Object.assign(followRef.current, { plotLeft: area.left - frame.left + scroller.scrollLeft, plotWidth: area.width, labels });
      setPlotWidth(Math.round(area.width));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(plot);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  const byId = useMemo(() => new Map(model.spans.map(span => [span.id, span])), [model]);
  const path = useMemo(() => pathFor(model, pinnedId), [model, pinnedId]);
  const visible = (span: TimelineSpan) => span.start <= shownT + 1e-6;
  const shownId = hoverId ?? focusId ?? pinnedId;
  const shownSpan = shownId ? byId.get(shownId) : undefined;
  const cardSpan = shownSpan && visible(shownSpan) ? shownSpan : undefined;
  const firstVisible = model.spans.find(visible);
  const roving = rovingId && byId.get(rovingId) && visible(byId.get(rovingId)!) ? rovingId : firstVisible?.id ?? null;

  // Connectors already on screen at first render (a finished run) never draw in; every later one does.
  const [initialLinks] = useState(() => new Set(model.connectors.filter(link => link.at <= (autoPlay || live ? 0 : duration)).map(link => link.id)));

  const hover = useCallback((id: string) => { window.clearTimeout(leaveTimer.current); setHoverId(id); }, []);
  const unhover = useCallback(() => {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setHoverId(null), 80);
  }, []);
  const focusSpan = useCallback((id: string, keyboard: boolean) => { setRovingId(id); if (keyboard) setFocusId(id); }, []);
  const blurSpan = useCallback(() => setFocusId(null), []);
  const pick = useCallback((id: string) => {
    const next = pinnedId === id ? null : id;
    setPinnedId(next);
    setRovingId(id);
    onSpanSelect?.(next ? byId.get(next) ?? null : null);
  }, [pinnedId, onSpanSelect, byId]);

  const unpin = () => { if (pinnedId) { setPinnedId(null); onSpanSelect?.(null); } };

  const play = () => {
    setInteracted(true);
    if (running && !live) { commit(timeRef.current, true); setPlaying(false); return; }
    if (done || held) {
      commit(0, true);
      unpin();
      setHoverId(null);
      followRef.current.manualUntil = 0;
      scrollerRef.current?.scrollTo({ left: 0, behavior: reduced ? "auto" : "smooth" });
    }
    setPlaying(true);
  };

  const restart = () => {
    setInteracted(true);
    commit(0, true);
    unpin();
    setHoverId(null);
    followRef.current.manualUntil = 0;
    scrollerRef.current?.scrollTo({ left: 0, behavior: reduced ? "auto" : "smooth" });
    setPlaying(true);
  };

  const timeFromPointer = (clientX: number) => {
    const area = plotRef.current?.getBoundingClientRect();
    if (!area || area.width <= 0) return timeRef.current;
    return clamp((clientX - area.left) / area.width, 0, 1) * duration;
  };

  const onScrubStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (live || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    knobRef.current?.focus({ preventScroll: true });
    scrubRef.current = { id: event.pointerId };
    setInteracted(true);
    setScrubbing(true);
    if (held) setPlaying(false);
    commit(timeFromPointer(event.clientX), true);
  };
  const onScrubMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (scrubRef.current?.id !== event.pointerId) return;
    commit(timeFromPointer(event.clientX));
  };
  const onScrubEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (scrubRef.current?.id !== event.pointerId) return;
    scrubRef.current = null;
    setScrubbing(false);
    commit(timeRef.current, true);
    if (timeRef.current >= duration) setPlaying(false);
  };
  const onScrubKey = (event: ReactKeyboardEvent<HTMLSpanElement>) => {
    if (live) return;
    const big = 5, small = event.shiftKey ? 5 : .5;
    const base = held ? duration : timeRef.current;
    const next = event.key === "ArrowRight" || event.key === "ArrowUp" ? base + small
      : event.key === "ArrowLeft" || event.key === "ArrowDown" ? base - small
        : event.key === "PageUp" ? base + big : event.key === "PageDown" ? base - big
          : event.key === "Home" ? 0 : event.key === "End" ? duration : null;
    if (next === null) return;
    event.preventDefault();
    setInteracted(true);
    if (held) setPlaying(false);
    commit(clamp(next, 0, duration), true);
  };

  const onSpanKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const id = (event.target as HTMLElement).dataset?.spanId;
    const span = id ? byId.get(id) : undefined;
    if (!span) return;
    if (event.key === "Escape") { if (pinnedId) { event.preventDefault(); unpin(); } return; }
    const rowSpans = (row: number) => model.byRow[row].filter(visible);
    const mid = (item: TimelineSpan) => (item.start + Math.min(item.end ?? shownT, shownT)) / 2;
    let next: TimelineSpan | undefined;
    const same = rowSpans(span.row), index = same.findIndex(item => item.id === span.id);
    if (event.key === "ArrowRight") next = same[index + 1];
    else if (event.key === "ArrowLeft") next = same[index - 1];
    else if (event.key === "Home") next = same[0];
    else if (event.key === "End") next = same.at(-1);
    else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const direction = event.key === "ArrowDown" ? 1 : -1;
      for (let row = span.row + direction; row >= 0 && row < model.agents.length && !next; row += direction) {
        const candidates = rowSpans(row);
        next = candidates.reduce<TimelineSpan | undefined>((best, item) => !best || Math.abs(mid(item) - mid(span)) < Math.abs(mid(best) - mid(span)) ? item : best, undefined);
      }
    } else return;
    event.preventDefault();
    if (!next) return;
    setRovingId(next.id);
    plotRef.current?.querySelector<HTMLElement>(`[data-span-id="${CSS.escape(next.id)}"]`)?.focus();
  };

  const onScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.toggleAttribute("data-scrolled", scroller.scrollLeft > 1);
    if (Math.abs(scroller.scrollLeft - followRef.current.auto) > 2) followRef.current.manualUntil = performance.now() + 2500;
    if (cardSpan) setScrollTick(tick => tick + 1);
  };

  // Counters at the current time.
  let tokensNow = 0, costNow = 0, activeAgents = 0, tokensTotal = 0, costTotal = 0;
  const activeRows = new Set<number>();
  for (const span of model.spans) {
    const progress = progressAt(span, shownT);
    tokensNow += (span.tokens ?? 0) * progress;
    tokensTotal += span.tokens ?? 0;
    costTotal += span.spanCost;
    costNow += span.spanCost * progress;
    if (span.kind !== "waiting" && span.start <= shownT && (span.open || shownT < span.end!)) activeRows.add(span.row);
  }
  activeAgents = activeRows.size;
  const speedup = model.totals.speedup;
  const summary = [
    `${model.agents.length} agents`,
    formatDuration(duration),
    speedup >= 1.1 ? `${speedup.toFixed(1)}x faster than sequential` : null,
    formatCost(model.totals.cost),
  ].filter(Boolean) as string[];
  const word = running ? "running" : shownT <= 0 ? "ready" : "paused";
  const announcement = done ? `Run finished: ${summary.join(", ")}` : running && interacted ? (live ? "Following the live run" : `Replaying at ${speed}x`) : interacted && !scrubbing ? `Paused at ${formatSeconds(shownT)}` : "";

  // Ticks and gridlines.
  const step = tickStep(axis, plotWidth);
  const ticks: number[] = [];
  for (let value = 0; value <= axis + 1e-6; value += step) ticks.push(Math.round(value * 100) / 100);
  const secondsWide = plotWidth / Math.max(axis, .001);
  const drawLinks = hydrated && !reduced;

  const options = Array.from(new Set([...speeds, speedProp])).sort((a, b) => a - b).map(value => ({ value: String(value), label: `${value}x` }));
  const rowsHeight = PAD + model.agents.length * ROW;
  const layoutKey = `${scrollTick}:${plotWidth}:${axisState}`;

  return <section
    ref={rootRef}
    className={[styles.root, className].filter(Boolean).join(" ")}
    style={style}
    aria-labelledby={`${uid}-title`}
    onKeyDown={event => { if (event.key === "Escape" && pinnedId && !(event.target as HTMLElement).dataset?.spanId) unpin(); }}
  >
    <div className={styles.inner}>
      <header className={styles.header}>
        <h3 id={`${uid}-title`} className={styles.title}>{heading}</h3>
        <div className={styles.status}>
          <p className={styles.layer} data-on={!done || undefined} aria-hidden={done || undefined}>
            <span className={styles.word}>
              <span className={styles.wordItem} data-on={word === "running" || undefined}><TextShimmer active={running && !reduced}>{live ? "Live" : "Running"}</TextShimmer></span>
              {!live && <span className={styles.wordItem} data-on={word === "paused" || undefined}>Paused</span>}
              {!live && <span className={styles.wordItem} data-on={word === "ready" || undefined}>Ready</span>}
            </span>
            <Sep />
            <span className={styles.part}><Count value={formatSeconds(shownT)} reserve={live ? undefined : formatSeconds(duration)} /></span>
            <Sep />
            <span className={styles.part}><Count value={formatTokens(tokensNow)} reserve={live ? undefined : formatTokens(tokensTotal)} /> <span className={styles.unit}>tokens</span></span>
            <Sep />
            <span className={styles.part}><Count value={formatCost(costNow)} reserve={live ? undefined : formatCost(costTotal)} /></span>
            {activeAgents > 0 && running ? <span className={styles.srOnly}>, {activeAgents} agents working</span> : null}
          </p>
          <p className={styles.layer} data-on={done || undefined} aria-hidden={!done || undefined}>
            <CircleCheck className={styles.doneIcon} aria-hidden="true" strokeWidth={1.75} />
            <span className={styles.srOnly}>Finished: </span>
            {summary.map((part, index) => <Fragment key={part}>{index > 0 && <Sep />}<span className={styles.part}>{part}</span></Fragment>)}
          </p>
        </div>
      </header>

      <div ref={scrollerRef} className={styles.scroller} onScroll={onScroll}>
        <div className={styles.body} style={{ "--now": shownT, "--axis": axis, "--rows-h": `${rowsHeight}px`, "--row": `${ROW}px`, "--bar": `${BAR}px`, "--pad": `${PAD}px`, "--axis-h": `${AXIS}px` } as CSSProperties}>
          <div className={styles.labels}>
            {model.agents.map(agent => <div key={agent.id} id={`${uid}-row-${agent.index}`} className={styles.label} style={{ "--c": agent.color } as CSSProperties}>
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.labelText}>
                <span className={styles.name}>{agent.name}</span>
                {agent.model && <span className={styles.model}><span className={styles.mark} aria-hidden="true">{modelMark(agent)}</span><span className={styles.modelName}>{agent.model}</span></span>}
              </span>
            </div>)}
          </div>
          <div className={styles.track}>
            <div
              ref={plotRef}
              className={styles.plot}
              data-path={path ? "" : undefined}
              onKeyDown={onSpanKey}
              onClick={event => { if (!(event.target as HTMLElement).closest("button") && !(event.target as HTMLElement).closest(".arc-timeline-axis")) unpin(); }}
            >
              <div className={styles.grid} aria-hidden="true">
                {ticks.map(value => <span key={value} className={styles.gridline} style={{ left: `calc(${at(value)})` }} />)}
              </div>
              <div className={styles.links} aria-hidden="true">
                {model.connectors.filter(link => link.at <= shownT + 1e-6).map(link => <span
                  key={link.id}
                  className={styles.link}
                  data-shape={link.shape}
                  data-dir={link.up ? "up" : "down"}
                  data-draw={drawLinks && (interacted || live || !initialLinks.has(link.id)) || undefined}
                  data-hot={path?.links.has(link.id) || undefined}
                  style={linkStyle(link)}
                />)}
              </div>
              {model.agents.map(agent => <div key={agent.id} role="group" aria-labelledby={`${uid}-row-${agent.index}`} className={styles.row} style={{ "--c": agent.color, top: PAD + agent.index * ROW } as CSSProperties}>
                {model.byRow[agent.index].filter(visible).map(span => {
                  const state: SpanState = span.open ? (live ? "active" : "done") : shownT < span.end! ? "active" : "done";
                  return <SpanButton
                    key={span.id}
                    span={span}
                    agentName={agent.name}
                    state={state}
                    dim={!!path && !path.spans.has(span.id)}
                    pinned={pinnedId === span.id}
                    tabbable={roving === span.id}
                    showIcon={span.open ? false : (span.end! - span.start) * secondsWide >= 15}
                    onHover={hover}
                    onLeave={unhover}
                    onFocusSpan={focusSpan}
                    onBlurSpan={blurSpan}
                    onPick={pick}
                  />;
                })}
              </div>)}
              <div className={styles.ports} aria-hidden="true">
                {model.connectors.filter(link => link.at <= shownT + 1e-6).map(link => <span
                  key={link.id}
                  className={styles.port}
                  data-draw={drawLinks && (interacted || live || !initialLinks.has(link.id)) || undefined}
                  data-hot={path?.links.has(link.id) || undefined}
                  style={portStyle(link)}
                />)}
              </div>
              <div className={styles.playhead} data-settled={(done && !scrubbing) || undefined} aria-hidden="true" />
              <div
                className={styles.axis}
                data-live={live || undefined}
                onPointerDown={onScrubStart}
                onPointerMove={onScrubMove}
                onPointerUp={onScrubEnd}
                onPointerCancel={onScrubEnd}
              >
                {ticks.map(value => <span key={value} className={styles.tick} style={{ left: `calc(${at(value)})` }} aria-hidden="true">{formatTick(value)}</span>)}
                <span
                  ref={knobRef}
                  className={styles.knob}
                  data-active={scrubbing || undefined}
                  role="slider"
                  tabIndex={live ? -1 : 0}
                  aria-label="Run time"
                  aria-valuemin={0}
                  aria-valuemax={Number(duration.toFixed(1))}
                  aria-valuenow={Number(shownT.toFixed(1))}
                  aria-valuetext={`${formatSeconds(shownT)} of ${formatSeconds(live ? shownT : duration)}`}
                  aria-disabled={live || undefined}
                  onKeyDown={onScrubKey}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        {!live && <div className={styles.controls}>
          <Button variant="secondary" size="sm" className={styles.iconButton} aria-label={running ? "Pause" : done || held ? "Replay" : "Play"} onClick={play}>
            <PlayGlyph playing={running} />
          </Button>
          <Button variant="ghost" size="sm" className={styles.iconButton} aria-label="Restart" onClick={restart}>
            <RotateCcw aria-hidden="true" strokeWidth={1.75} />
          </Button>
          {options.length > 1 && <SegmentedControl label="Playback speed" options={options} value={String(speed)} onValueChange={value => setSpeed(Number(value))} />}
        </div>}
        <ul className={styles.legend} aria-label="Legend">
          <li><span className={styles.swatch} data-kind="thinking" aria-hidden="true" />Thinking</li>
          <li><span className={styles.swatch} data-kind="tool" aria-hidden="true" />Tool call</li>
          <li><span className={styles.swatch} data-kind="waiting" aria-hidden="true" />Waiting</li>
          <li><CornerDownRight className={styles.legendIcon} aria-hidden="true" strokeWidth={1.75} />Handoff</li>
          {model.spans.some(span => span.status === "failed") && <li><CircleX className={styles.legendFailed} aria-hidden="true" strokeWidth={1.75} />Failed</li>}
        </ul>
      </footer>
    </div>

    <AnimatePresence>
      {cardSpan && <SpanCard key="card" span={cardSpan} model={model} now={shownT} layoutKey={layoutKey} reduced={reduced} rootRef={rootRef} plotRef={plotRef} axisRef={axisRef} />}
    </AnimatePresence>
    <p className={styles.srOnly} aria-live="polite">{announcement}</p>
  </section>;
}

export default AgentTimeline;
