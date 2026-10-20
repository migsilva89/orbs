import { Search } from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { GlassSurface } from './glass-surface';
import { Icon } from './icon';
import { TextField } from './text-field';
import type { ComponentProps } from 'react';

interface SearchFieldProps extends Omit<ComponentProps<typeof TextField>, 'size'> {
  accessibilityLabel: string;
}

export function SearchField({ className, ...props }: SearchFieldProps) {
  return (
    <GlassSurface className={cn('h-12 flex-row items-center gap-3 px-4', className)}>
      <Icon icon={Search} size="action" tone="glass-muted" />
      <TextField
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
        {...props}
        className="min-w-0 flex-1 px-0"
        placeholderTone="glass-muted"
        size="lg"
      />
    </GlassSurface>
  );
}
