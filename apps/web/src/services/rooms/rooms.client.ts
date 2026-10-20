import { linkOptions, notFound } from '@tanstack/react-router';
import { rpc } from '@/services/rpc/rpc.client';
import type { Bot } from '@openbots/contracts/universal';
import type { QueryClient } from '@tanstack/react-query';

export async function roomsDirectBot(queryClient: QueryClient, { handle }: Pick<Bot, 'handle'>) {
  const bots = await queryClient.ensureQueryData(rpc.bots.list.queryOptions());
  const bot = bots.find((item) => item.handle === handle);

  if (!bot) {
    throw notFound();
  }

  return bot;
}

export function roomsLink({ handle }: Pick<Bot, 'handle'>) {
  return linkOptions({ to: '/rooms/direct/$handle', params: { handle } });
}
