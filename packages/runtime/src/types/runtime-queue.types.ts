import type { InboxItem } from '@earendil-works/pi-durable';

export type RuntimeQueuedInput = Extract<InboxItem, { mode: 'followUp' | 'steer' }>;
