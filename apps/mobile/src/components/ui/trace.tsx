import { cva } from 'cva';
import { ChevronRight } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { match } from 'ts-pattern';
import { cn } from '@/lib/cn';
import { Icon } from './icon';
import { Text, textContext } from './text';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';

export type TraceStatus = 'running' | 'error' | 'done';

const traceVariants = cva({
  base: 'w-full gap-1 py-1',
  variants: { align: { center: 'items-center', start: 'items-start' } },
  defaultVariants: { align: 'start' },
});

const traceCodeVariants = cva({
  base: 'max-h-64 rounded-2xl border border-border bg-muted',
  variants: { tone: { default: '', destructive: 'border-destructive/40' } },
  defaultVariants: { tone: 'default' },
});

interface TraceProps extends ViewProps {
  align?: 'center' | 'start';
}

/** A quiet line in the transcript for work that is not a message: thinking, tool calls, notices. */
export function Trace({ align, className, ...props }: TraceProps) {
  return <View {...props} className={cn(traceVariants({ align }), className)} />;
}

interface TraceRowProps {
  title: string;
  icon?: LucideIcon;
  /** Shown instead of the icon, such as a bot avatar. */
  avatar?: ReactNode;
  preview?: string;
  status?: TraceStatus;
  open?: boolean;
  onPress?: () => void;
}

export function TraceRow({ title, icon, avatar, preview, status = 'done', open, onPress }: TraceRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open, busy: status === 'running' }}
      className="min-h-7 max-w-full flex-row items-center gap-1.5 rounded-md px-1.5 active:bg-accent"
      disabled={!onPress}
      onPress={onPress}
    >
      <textContext.Provider value={{ tone: status === 'error' ? 'destructive' : 'muted' }}>
        {avatar ?? (icon ? <Icon icon={icon} size="sm" /> : null)}
        <Text className="shrink-0" variant="trace">{title}</Text>
        {preview ? <Text className="shrink" numberOfLines={1} variant="trace-preview">{preview}</Text> : null}
        {match(status)
          .with('running', () => <ActivityIndicator size="small" />)
          .otherwise(() => null)}
        {onPress ? (
          <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
            <Icon icon={ChevronRight} size="sm" />
          </View>
        ) : null}
      </textContext.Provider>
    </Pressable>
  );
}

export function TraceContent({ className, ...props }: ViewProps) {
  return <View {...props} className={cn('w-full gap-2 px-1.5 pb-1', className)} />;
}

interface TraceCodeProps {
  children: string;
  tone?: 'default' | 'destructive';
}

export function TraceCode({ children, tone }: TraceCodeProps) {
  return (
    <ScrollView className={traceCodeVariants({ tone })} contentContainerClassName="p-3" nestedScrollEnabled>
      <Text selectable tone={tone === 'destructive' ? 'destructive' : 'muted'} variant="trace-code">{children}</Text>
    </ScrollView>
  );
}
