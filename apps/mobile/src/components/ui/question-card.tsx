import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { Card } from './card';
import { Text, textContext } from './text';
import type { ReactNode } from 'react';
import type { PressableProps, ViewProps } from 'react-native';

/** A prompt the bot is waiting on: an approval or a question with choices. */
export function QuestionCard({ className, children, ...props }: ViewProps) {
  return (
    <Card {...props} className={cn('mx-3 my-2 gap-3 p-4', className)}>
      {children}
    </Card>
  );
}

interface QuestionCardHeaderProps {
  title: string;
  descriptions?: string[];
  action?: ReactNode;
}

export function QuestionCardHeader({ title, descriptions = [], action }: QuestionCardHeaderProps) {
  return (
    <View className="flex-row items-start gap-2">
      <View className="flex-1 gap-1">
        <Text variant="item-title">{title}</Text>
        {descriptions.map((description) => <Text key={description} tone="muted" variant="small">{description}</Text>)}
      </View>
      {action}
    </View>
  );
}

export function QuestionCardOptions({ className, ...props }: ViewProps) {
  return <View {...props} className={cn('gap-2', className)} />;
}

interface QuestionCardOptionProps extends Omit<PressableProps, 'children'> {
  children: ReactNode;
  selected?: boolean;
}

export function QuestionCardOption({ children, selected = false, disabled = false, ...props }: QuestionCardOptionProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      className={cn('min-h-11 flex-row items-center gap-2 rounded-xl border border-border px-4 active:bg-accent', selected && 'border-primary bg-accent', disabled && 'opacity-50')}
      disabled={disabled}
    >
      <textContext.Provider value={{ variant: 'body', tone: 'default' }}>{children}</textContext.Provider>
    </Pressable>
  );
}
