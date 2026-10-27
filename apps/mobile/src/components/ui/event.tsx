import { m } from '@repo/i18n/client';
import { Ban, Check, ChevronDown, CircleAlert, LoaderCircle, ShieldQuestion } from 'lucide-react-native';
import { createContext, use, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';
import { cn } from '@/lib/cn';
import { Icon } from './icon';
import { messageOutline, messageSurface } from './message';
import { Text, textContext } from './text';
import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';

export type EventStatus = 'running' | 'done' | 'error' | 'approval' | 'denied';

// Every chat event reads the same: a centred muted line of label, then icon and name a step brighter, then a status
// icon. An event with details opens a card under its line; the line never moves. Icons and avatars all sit in 16pt.
const eventLine = 'min-h-8 max-w-full flex-row items-center justify-center gap-1.5 px-5';

const eventText = { variant: 'featured-name', tone: 'muted' } as const;

// Web's shimmer on a running label, as the typing label's pulse; a spinner turns like web's loader.
const EVENT_MOTION = {
  pulse: {
    animationName: { '0%': { opacity: 0.5 }, '50%': { opacity: 1 }, '100%': { opacity: 0.5 } },
    animationDuration: '1.8s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
  },
  spin: {
    animationName: { from: { transform: [{ rotate: '0deg' }] }, to: { transform: [{ rotate: '360deg' }] } },
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
  durationMs: 200,
} as const;

const eventStatusContext = createContext<EventStatus | undefined>(undefined);

/** Pulses its content while the event runs, unless the reader asked for less motion. */
function EventPulse({ isRunning, children }: { isRunning: boolean; children: ReactNode }) {
  const isReduced = useReducedMotion();

  return isRunning && !isReduced ? <Animated.View className="min-w-0 shrink" style={EVENT_MOTION.pulse}>{children}</Animated.View> : children;
}

/** A run of events, stacked and centred. */
export function EventList({ className, ...props }: ViewProps) {
  return <View {...props} className={cn('w-full items-center py-1', className)} />;
}

interface EventLineProps {
  status?: EventStatus;
  children: ReactNode;
}

/** One line that does not open. */
export function EventLine({ status, children }: EventLineProps) {
  return (
    <View className={eventLine}>
      <eventStatusContext.Provider value={status}>
        <textContext.Provider value={eventText}>
          {children}
          <EventStatusIcon status={status} />
        </textContext.Provider>
      </eventStatusContext.Provider>
    </View>
  );
}

export function EventLabel({ children }: { children: string }) {
  return (
    <EventPulse isRunning={use(eventStatusContext) === 'running'}>
      <Text className="shrink-0">{children}</Text>
    </EventPulse>
  );
}

interface EventNameProps {
  /** One icon, or several that overlap in a stack like avatars. */
  icon?: ReactNode | ReactNode[];
  children?: string;
}

/** The thing the event is about, with its icon: a todo, a routine, a bot, a command. */
export function EventName({ icon, children }: EventNameProps) {
  const stack = Array.isArray(icon) ? (
    <View className="flex-row">
      {icon.map((item, index) => (
        <View className={cn('size-5 items-center justify-center overflow-hidden rounded-full bg-background', messageOutline, index > 0 && '-ml-1.5')} key={index}>
          {item}
        </View>
      ))}
    </View>
  ) : null;

  return (
    <View className="min-w-0 shrink flex-row items-center gap-1.5">
      {stack ?? (icon ? <View className="size-4 items-center justify-center">{icon}</View> : null)}
      {children === undefined ? null : <Text className="shrink" numberOfLines={1} tone="subtle">{children}</Text>}
    </View>
  );
}

const EVENT_STATUS_ICONS = {
  done: { icon: Check, tone: 'success' },
  error: { icon: CircleAlert, tone: 'destructive' },
  approval: { icon: ShieldQuestion, tone: 'default' },
  denied: { icon: Ban, tone: 'muted' },
} as const;

/** Status as a 12pt icon with a spoken label. A line hides running, which pulses its label, and done; a detailed row shows both. */
function EventStatusIcon({ status, isDetailed = false }: { status: EventStatus | undefined; isDetailed?: boolean }) {
  const isReduced = useReducedMotion();

  if (!status || (!isDetailed && (status === 'running' || status === 'done'))) {
    return null;
  }

  const labels = {
    running: m.ui_tool_state_running(),
    done: m.ui_tool_state_completed(),
    error: m.ui_tool_state_error(),
    approval: m.ui_tool_state_approval(),
    denied: m.ui_tool_state_denied(),
  } satisfies Record<EventStatus, string>;

  return (
    <View accessible accessibilityLabel={labels[status]} className="size-4 items-center justify-center">
      {status === 'running' ? (
        <Animated.View style={isReduced ? undefined : EVENT_MOTION.spin}>
          <Icon icon={LoaderCircle} size="sm" tone="muted" />
        </Animated.View>
      ) : (
        <Icon icon={EVENT_STATUS_ICONS[status].icon} size="sm" tone={EVENT_STATUS_ICONS[status].tone} />
      )}
    </View>
  );
}

function EventChevron({ open }: { open: boolean }) {
  return (
    <Animated.View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }], transitionProperty: 'transform', transitionDuration: EVENT_MOTION.durationMs }}>
      <Icon icon={ChevronDown} size="sm" tone="muted" />
    </Animated.View>
  );
}

/** Details fade in under their line while what follows slides down, like web's opening height. */
function EventReveal({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Animated.View className={className} entering={FadeIn.duration(EVENT_MOTION.durationMs)} exiting={FadeOut.duration(EVENT_MOTION.durationMs)}>
      {children}
    </Animated.View>
  );
}

const eventContext = createContext<{ open: boolean; toggle?: () => void }>({ open: false });

interface EventProps {
  /** Opens on its own until the reader toggles it, such as reasoning while it streams. */
  defaultOpen?: boolean;
  children: ReactNode;
}

/** An event that opens a card under its line. */
export function Event({ defaultOpen = false, children }: EventProps) {
  const [open, setOpen] = useState<boolean>();
  const isOpen = open ?? defaultOpen;

  return (
    <eventContext.Provider value={{ open: isOpen, toggle: () => setOpen(!isOpen) }}>
      <Animated.View className="w-full items-center" layout={LinearTransition.duration(EVENT_MOTION.durationMs)}>{children}</Animated.View>
    </eventContext.Provider>
  );
}

interface EventTriggerProps {
  status?: EventStatus;
  children: ReactNode;
}

/** The line that opens an event. */
export function EventTrigger({ status, children }: EventTriggerProps) {
  const { open, toggle } = use(eventContext);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open, busy: status === 'running' }}
      className={eventLine}
      onPress={toggle}
    >
      <eventStatusContext.Provider value={status}>
        <textContext.Provider value={eventText}>
          {children}
          <EventStatusIcon status={status} />
          <EventChevron open={open} />
        </textContext.Provider>
      </eventStatusContext.Provider>
    </Pressable>
  );
}

/** The card under an open event's line. */
export function EventContent({ children }: { children: ReactNode }) {
  const { open } = use(eventContext);

  return open ? (
    <EventReveal className="w-full px-5 pt-1 pb-2">
      <View className={cn('overflow-hidden', messageSurface)} style={{ borderCurve: 'continuous' }}>{children}</View>
    </EventReveal>
  ) : null;
}

/** Detail text in an open card: a note, an error, or a thought. */
export function EventBody({ children }: { children: ReactNode }) {
  return (
    <ScrollView className="max-h-72 grow-0" contentContainerClassName="px-4 py-3" nestedScrollEnabled>
      <textContext.Provider value={{ variant: 'item-description', tone: 'muted' }}>{children}</textContext.Provider>
    </ScrollView>
  );
}

/** Structured details, such as a tool call's input and output. */
export function EventDetails({ className, ...props }: ViewProps) {
  return <View {...props} className={cn('gap-2 px-4 py-3', className)} />;
}

export function EventItems({ children }: { children: ReactNode }) {
  return <View className="py-1">{children}</View>;
}

interface EventItemProps {
  icon: ReactNode;
  label: string;
  preview?: string;
  description?: string;
  status: EventStatus;
  children: ReactNode;
}

/** One row of an open card, such as a tool call, that opens on its own details. */
export function EventItem({ icon, label, preview, description, status, children }: EventItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <Animated.View layout={LinearTransition.duration(EVENT_MOTION.durationMs)}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open, busy: status === 'running' }}
        className="flex-row items-start gap-3 px-4 py-2"
        onPress={() => setOpen(!open)}
      >
        <View className="mt-0.5 size-4 items-center justify-center">{icon}</View>
        <View className="min-w-0 flex-1 gap-0.5">
          <EventPulse isRunning={status === 'running'}>
            <Text numberOfLines={1} variant="item-description">
              {label}
              {preview ? <Text tone="muted" variant="item-description">{`  ${preview}`}</Text> : null}
            </Text>
          </EventPulse>
          {description ? <Text numberOfLines={1} tone="muted" variant="small">{description}</Text> : null}
        </View>
        <View className="mt-0.5 flex-row items-center gap-2">
          <EventStatusIcon isDetailed status={status} />
          <EventChevron open={open} />
        </View>
      </Pressable>
      {open ? (
        <EventReveal>
          <EventDetails className="pt-0 pl-11">{children}</EventDetails>
        </EventReveal>
      ) : null}
    </Animated.View>
  );
}
