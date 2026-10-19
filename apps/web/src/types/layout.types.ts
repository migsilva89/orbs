import type { LinkProps } from '@tanstack/react-router';
import type { ComponentType } from 'react';

export interface LayoutMenuItem {
  label: () => string
  icon: ComponentType<{ className?: string }>
  link: NonNullable<LinkProps['to']>
}

export interface LayoutSidebarsOpen {
  rooms: boolean
  details: boolean
}
