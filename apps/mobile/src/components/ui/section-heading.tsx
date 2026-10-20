import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { match } from 'ts-pattern';
import { cn } from '@/lib/cn';
import { Icon } from './icon';
import { Text } from './text';
import type { PressableProps } from 'react-native';

interface SectionHeadingProps extends Omit<PressableProps, 'children'> {
  label: string;
  expanded: boolean;
}

export function SectionHeading({ label, expanded, className, ...props }: SectionHeadingProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      className={cn('min-h-11 flex-row items-center gap-2 px-5 py-2', className)}
    >
      <Text tone="muted" variant="section-title">{label}</Text>
      <Icon icon={match(expanded).with(true, () => ChevronDown).with(false, () => ChevronRight).exhaustive()} tone="muted" />
    </Pressable>
  );
}
