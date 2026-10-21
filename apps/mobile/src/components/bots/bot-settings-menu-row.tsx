import { ChevronsUpDown } from 'lucide-react-native';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, ItemValue } from '@/components/ui/item';
import { Menu } from '@/components/ui/menu';
import type { MenuItem } from '@/types/menu.types';
import type { LucideIcon } from 'lucide-react-native';

interface BotSettingsMenuRowProps {
  icon: LucideIcon;
  title: string;
  value: string;
  description?: string;
  items: MenuItem[];
  isDisabled?: boolean;
}

export function BotSettingsMenuRow({ icon, title, value, description, items, isDisabled = false }: BotSettingsMenuRowProps) {
  return (
    <Item className={isDisabled ? 'opacity-50' : undefined}>
      <ItemMedia>
        <Icon icon={icon} tone="muted" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        {description ? <ItemDescription numberOfLines={0}>{description}</ItemDescription> : null}
      </ItemContent>
      <View className="max-w-1/2">
        <Menu
          isDisabled={isDisabled}
          items={items}
          title={title}
        >
          <View
            accessibilityLabel={`${title}: ${value}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled }}
            className="flex-row items-center gap-1 py-1"
          >
            <ItemValue>{value}</ItemValue>
            <Icon
              icon={ChevronsUpDown}
              size="sm"
              tone="muted"
            />
          </View>
        </Menu>
      </View>
    </Item>
  );
}
