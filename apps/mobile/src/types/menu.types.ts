import type { Button } from '@expo/ui/swift-ui';
import type { ComponentProps, ReactElement } from 'react';

export type MenuSymbol = NonNullable<ComponentProps<typeof Button>['systemImage']>;

export interface MenuItem {
  label: string;
  systemImage?: MenuSymbol;
  isDestructive?: boolean;
  hasDividerBefore?: boolean;
  onSelect?: () => void;
  items?: MenuItem[];
}

export interface MenuProps {
  title?: string;
  items: MenuItem[];
  children: ReactElement;
  isFullWidth?: boolean;
}
