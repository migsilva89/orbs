import { attachmentActionRemove } from './attachment-action.remove';
import { attachmentActionUpload } from './attachment-action.upload';
import { attachmentQueryDownload } from './attachment-query.download';
import type { AttachmentPrepareParams, AttachmentServiceDeps } from '../../types/attachment.types';
import type { AttachmentGetInput, AttachmentListInput, AttachmentUploadInput } from '@openbots/contracts/universal';

export function makeAttachmentService(deps: AttachmentServiceDeps) {
  return {
    actions: {
      upload: (params: AttachmentUploadInput) => attachmentActionUpload(deps, params),
      remove: (params: AttachmentGetInput) => attachmentActionRemove(deps, params),
      prepare: (params: AttachmentPrepareParams) => deps.runtime.actions.retainAttachments(params),
    },
    queries: {
      download: (params: AttachmentGetInput) => attachmentQueryDownload(deps, params),
      list: (params: AttachmentListInput) => deps.runtime.queries.attachments(params),
    },
  };
}

export type AttachmentService = ReturnType<typeof makeAttachmentService>;
