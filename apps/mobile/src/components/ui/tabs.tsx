import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './text';

interface TabsOption<T extends string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string> {
  value: T;
  options: TabsOption<T>[];
  onValueChange: (value: T) => void;
}

/** A muted segmented switch between views, like the web `TabsList` muted variant. */
export function Tabs<T extends string>({ value, options, onValueChange }: TabsProps<T>) {
  return (
    <View accessibilityRole="tablist" className="flex-row self-center rounded-lg bg-muted p-1">
      {options.map((option) => (
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: option.value === value }}
          className={cn('rounded-md px-4 py-1.5', option.value === value && 'bg-background shadow-sm')}
          key={option.value}
          onPress={() => onValueChange(option.value)}
        >
          <Text tone={option.value === value ? 'default' : 'muted'} variant="button-small">{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
