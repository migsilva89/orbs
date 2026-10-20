import { cva } from 'cva';
import { Children, Fragment } from 'react';
import { ActionSheetIOS, Pressable, View } from 'react-native';
import { match, P } from 'ts-pattern';
import { cn } from '@/lib/cn';
import { Icon } from './icon';
import { Text, textContext } from './text';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import type { PressableProps, ViewProps } from 'react-native';

const actionSheetItemVariants = cva({
  base: 'min-h-14 flex-row items-center gap-4 px-5 active:bg-accent',
  variants: { disabled: { true: 'opacity-50' } },
});

/** The body of a native form sheet: reaction choices above grouped actions. */
export function ActionSheet({ className, ...props }: ViewProps) {
  return <View {...props} className={cn('gap-3 px-4 pt-6 pb-10', className)} />;
}

export function ActionSheetChoices({ className, ...props }: ViewProps) {
  return <View {...props} className={cn('flex-row flex-wrap justify-between gap-y-3 px-2 pb-2', className)} />;
}

interface ActionSheetChoiceProps extends Omit<PressableProps, 'children'> {
  /** The emoji to show. */
  children?: string;
  /** An icon instead of an emoji, for a choice such as "more". */
  icon?: LucideIcon;
  accessibilityLabel: string;
  selected?: boolean;
}

export function ActionSheetChoice({ children, icon, selected = false, disabled = false, ...props }: ActionSheetChoiceProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      className={cn('size-14 items-center justify-center rounded-full bg-secondary active:opacity-70', selected && 'border-2 border-primary', disabled && 'opacity-50')}
      disabled={disabled}
    >
      {match(icon)
        .with(P.nonNullable, (choice) => <Icon icon={choice} size="action" tone="muted" />)
        .otherwise(() => <Text variant="emoji">{children}</Text>)}
    </Pressable>
  );
}

interface ActionSheetGroupProps {
  children: ReactNode;
}

/** A rounded group of actions, separated by inset hairlines. */
export function ActionSheetGroup({ children }: ActionSheetGroupProps) {
  const items = Children.toArray(children);

  return (
    <View className="overflow-hidden rounded-2xl bg-secondary">
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 ? <View className="ml-14 h-px bg-border" /> : null}
          {item}
        </Fragment>
      ))}
    </View>
  );
}

interface ActionSheetItemProps extends Omit<PressableProps, 'children'> {
  icon: LucideIcon;
  children: string;
}

export function ActionSheetItem({ icon, children, disabled = false, ...props }: ActionSheetItemProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={actionSheetItemVariants({ disabled })}
      disabled={disabled}
    >
      <textContext.Provider value={{ tone: 'default' }}>
        <Icon icon={icon} size="action" />
        <Text variant="action">{children}</Text>
      </textContext.Provider>
    </Pressable>
  );
}

interface ActionSheetChoiceOption {
  label: string;
  isDestructive?: boolean;
  onSelect: () => void;
}

interface ActionSheetShowParams {
  title?: string;
  cancelLabel: string;
  choices: ActionSheetChoiceOption[];
}

/** Ask for one of a few choices with the native iOS action sheet, as web uses a select or dropdown. */
export function actionSheetShow({ title, cancelLabel, choices }: ActionSheetShowParams) {
  const destructiveButtonIndex = choices.flatMap((choice, index) => (choice.isDestructive ? [index + 1] : []));

  ActionSheetIOS.showActionSheetWithOptions({
    title,
    options: [cancelLabel, ...choices.map((choice) => choice.label)],
    cancelButtonIndex: 0,
    destructiveButtonIndex,
  }, (index) => choices[index - 1]?.onSelect());
}
