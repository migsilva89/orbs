import type { BotSection } from '@repo/contracts/universal';
import type { ComponentType, CSSProperties } from 'react';

export type BotBubbleStyle = CSSProperties & { '--bubble': string; '--bubble-foreground': string };

export interface BotNavItem {
  id: BotSection
  label: () => string
  description: () => string
  icon: ComponentType<{ className?: string }>
}

export type BotDialogView =
  | { kind: 'create' }
  | { kind: 'section'; botId: string; section: BotSection }
  | { kind: 'delete'; botId: string }
  | { kind: 'reset'; botId: string }
  | { kind: 'routine-edit'; botId: string; routineId: string }
  | { kind: 'routine-delete'; botId: string; routineId: string }
  | { kind: 'todo-delete'; botId: string; todoId: string };
