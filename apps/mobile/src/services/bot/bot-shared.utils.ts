import type { BotSharedSelectedParams } from '@/types/bot-shared.types';

export function botSharedSelected({ resource, names, inherit, shared }: BotSharedSelectedParams): Set<string> {
  if (!inherit.includes(resource)) {
    return new Set();
  }

  return new Set(shared?.length ? names.filter((name) => shared.includes(name)) : names);
}
