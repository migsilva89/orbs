import { defineDoc } from '@earendil-works/pi-durable';
import { ATTACHMENT } from '@openbots/contracts/universal';
import type { RuntimeAttachments } from '../../types/attachment.types';

export const RUNTIME_ATTACHMENT_ENTRY = ATTACHMENT.entryKind;

export const runtimeAttachments = defineDoc({
  kind: 'openbots.attachments',
  version: 1,
  scope: 'conversation',
  history: 'latest',
  fork: 'initial',
  initial: (): RuntimeAttachments => ({ files: {} }),
});
