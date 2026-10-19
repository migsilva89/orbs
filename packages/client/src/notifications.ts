import { applyImmutable } from '@earendil-works/chord/delta';
import type { Client } from './types/client.types';
import type { NotificationState } from '@openbots/contracts/universal';

export async function* watchNotifications(client: Client, signal: AbortSignal) {
  const frames = await client.conversation.watchNotifications(undefined, { signal });
  let state: NotificationState | undefined;

  for await (const ops of frames) {
    state = applyImmutable<NotificationState>(state, ops);
    yield state;
  }
}
