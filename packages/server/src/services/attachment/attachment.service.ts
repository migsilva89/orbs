import { attachmentActionRemove } from './attachment-action.remove';
import { attachmentActionUpload } from './attachment-action.upload';
import { attachmentQueryDownload } from './attachment-query.download';
import type { AttachmentPrepareParams, AttachmentServiceDeps } from '../../types/attachment.types';
import type * as UniversalTypes from '@openbots/contracts/universal';

export function makeAttachmentService(deps: AttachmentServiceDeps) {
  return {
    actions: {
      upload: (params: UniversalTypes.AttachmentUploadInput) => attachmentActionUpload(deps, params),
      remove: (params: UniversalTypes.AttachmentGetInput) => attachmentActionRemove(deps, params),
      prepare: (params: AttachmentPrepareParams) => deps.runtime.actions.retainAttachments(params),
      clear: (params: UniversalTypes.BotGetInput) => deps.storage.actions.clear(params),
    },
    queries: {
      download: (params: UniversalTypes.AttachmentGetInput) => attachmentQueryDownload(deps, params),
      list: (params: UniversalTypes.AttachmentListInput) => deps.runtime.queries.attachments(params),
    },
  };
}

export type AttachmentService = ReturnType<typeof makeAttachmentService>;
