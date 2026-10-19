import type { Context } from '@earendil-works/chord/context';
import type { CommitPublication, Harness } from '@earendil-works/pi-durable';
import type { NotificationItem, NotificationState } from '@openbots/contracts/universal';

export type { NotificationItem, NotificationState };

export interface NotificationServiceDeps {
  harness: Harness;
}

export interface NotificationQueuedCommit {
  publication: CommitPublication;
  commitContext: Context;
}
