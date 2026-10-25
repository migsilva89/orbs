import type { Context } from '@earendil-works/chord/context';
import type { CommitPublication, Harness } from '@earendil-works/pi-durable';
import type { NotificationItem, NotificationState } from '@repo/contracts/universal';

export type { NotificationItem, NotificationState };

export interface NotificationServiceDeps {
  harness: Harness;
  botId: string;
}

export interface NotificationQueuedCommit {
  publication: CommitPublication;
  commitContext: Context;
}

export type NotificationTask = () => Promise<void>;
