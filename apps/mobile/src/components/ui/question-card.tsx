import { cva } from 'cva';
import { LinearGradient as NativeLinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';
import { withUniwind } from 'uniwind';
import { cn } from '@/lib/cn';
import { Text, textContext } from './text';
import type { VariantProps } from 'cva';
import type { ReactNode } from 'react';
import type { PressableProps, ViewProps } from 'react-native';

/** A prompt the bot is waiting on: an approval or a question with choices. */
export function QuestionCard({ className, children, ...props }: ViewProps) {
  return (
    <View {...props} className={cn('mx-5 my-2 gap-3 rounded-2xl bg-secondary p-3', className)}>
      {children}
    </View>
  );
}

interface QuestionCardHeaderProps {
  title: string;
  descriptions?: string[];
  action?: ReactNode;
}

export function QuestionCardHeader({ title, descriptions = [], action }: QuestionCardHeaderProps) {
  return (
    <View className="flex-row items-start gap-2 pt-0.5 pl-1">
      <View className="flex-1 gap-0.5">
        <Text variant="item-title">{title}</Text>
        {descriptions.map((description) => <Text key={description} tone="muted" variant="small">{description}</Text>)}
      </View>
      {action}
    </View>
  );
}

/** The choices as one bordered list, like the web card. */
export function QuestionCardOptions({ className, ...props }: ViewProps) {
  return <View {...props} className={cn('overflow-hidden rounded-xl border border-border bg-background', className)} />;
}

const LinearGradient = withUniwind(NativeLinearGradient);

/** Glossy letter badges like the web buttons: solid fill, a 1px ring, a top highlight and a soft white sheen. */
const questionCardBadgeVariants = cva({
  base: 'size-7 items-center justify-center overflow-hidden rounded-md',
  variants: {
    tone: {
      default: 'bg-primary shadow-[0_1px_2px_0_rgba(14,18,27,0.24),0_0_0_1px_var(--color-primary),inset_0_1px_0_rgba(255,255,255,0.24)]',
      success: 'bg-success shadow-[0_1px_2px_0_rgba(14,18,27,0.24),0_0_0_1px_var(--color-success),inset_0_1px_0_rgba(255,255,255,0.24)]',
      info: 'bg-blue-500 shadow-[0_1px_2px_0_rgba(14,18,27,0.24),0_0_0_1px_var(--color-blue-500),inset_0_1px_0_rgba(255,255,255,0.24)]',
      muted: 'bg-zinc-500 shadow-[0_1px_2px_0_rgba(14,18,27,0.24),0_0_0_1px_var(--color-zinc-500),inset_0_1px_0_rgba(255,255,255,0.24)]',
    },
  },
  defaultVariants: { tone: 'default' },
});

interface QuestionCardOptionProps extends Omit<PressableProps, 'children'>, VariantProps<typeof questionCardBadgeVariants> {
  /** Position in the list; shown as a letter badge (A, B, C…). */
  index: number;
  children: ReactNode;
  selected?: boolean;
}

export function QuestionCardOption({ index, tone = 'default', children, selected = false, disabled = false, ...props }: QuestionCardOptionProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      className={cn(
        'min-h-12 flex-row items-center gap-3 px-3 py-2.5 active:bg-accent',
        index > 0 && 'border-t border-border',
        selected && 'bg-accent',
        disabled && 'opacity-50',
      )}
      disabled={disabled}
    >
      <View className={questionCardBadgeVariants({ tone })}>
        <LinearGradient className="absolute inset-0" colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']} pointerEvents="none" />
        <Text tone={tone === 'default' ? 'on-primary' : 'on-blue'} variant="option-letter">{String.fromCodePoint(65 + index)}</Text>
      </View>
      <textContext.Provider value={{ variant: 'body', tone: 'default' }}>{children}</textContext.Provider>
    </Pressable>
  );
}
