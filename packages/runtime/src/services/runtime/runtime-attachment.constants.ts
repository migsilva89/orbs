import { defineDoc } from '@earendil-works/pi-durable';
import { ATTACHMENT } from '@repo/contracts/universal';
import type { RuntimeAttachments } from '../../types/runtime-attachment.types';

export const RUNTIME_ATTACHMENT_ENTRY = ATTACHMENT.entryKind;

export const runtimeAttachments = defineDoc({
  kind: 'bots.attachments',
  version: 1,
  scope: 'conversation',
  history: 'latest',
  fork: 'initial',
  initial: (): RuntimeAttachments => ({ files: {} }),
  checkpointWhen: () => false,
});
