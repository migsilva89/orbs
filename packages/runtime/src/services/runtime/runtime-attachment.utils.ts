import { ATTACHMENT, attachmentMessage } from '@repo/contracts/universal';
import { match, P } from 'ts-pattern';
import { RUNTIME_ATTACHMENT_ENTRY } from './runtime-attachment.constants';
import type { UserInput } from '@earendil-works/pi-durable';
import type { Attachment } from '@repo/contracts/universal';

function runtimeAttachmentPath(conversationId: number, file: Pick<Attachment, 'id' | 'name'>) {
  return `.attachments/${conversationId}/${file.id}/${file.name}`;
}

export function runtimeAttachmentIsExpired(file: Attachment, now = Date.now()) {
  return !file.isRetained && file.createdAt + ATTACHMENT.pendingTtlMs <= now;
}

export function runtimeAttachmentMessage(entry: unknown) {
  return match(entry)
    .with({ kind: RUNTIME_ATTACHMENT_ENTRY, data: P.nonNullable }, ({ data }) => match(attachmentMessage.safeParse(data))
      .with({ success: true }, ({ data: value }) => value)
      .otherwise(() => undefined))
    .otherwise(() => undefined);
}

export function runtimeAttachmentInput(conversationId: number, content: UserInput, attachments?: Attachment[]) {
  return match(attachments ?? [])
    .with([], () => undefined)
    .otherwise((files) => match(content)
      .with(P.string, (text) => ({
        content: `${text}\n\nAttachments:\n${files.map((file) => (
          `- ${JSON.stringify(file.name)} (${file.mediaType}) at ${JSON.stringify(runtimeAttachmentPath(conversationId, file))}`
        )).join('\n')}`,
        entry: {
          kind: RUNTIME_ATTACHMENT_ENTRY,
          data: { content: text, attachments: files },
        },
      }))
      .otherwise(() => undefined));
}
