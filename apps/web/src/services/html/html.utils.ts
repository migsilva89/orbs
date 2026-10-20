import { htmlReplyContent } from '@openbots/client/client';
import { parseMarkdownIntoBlocks } from 'streamdown';

export function htmlReplyBlocks(content: string): string[] {
  if (content.trimStart().startsWith('<') && htmlReplyContent(content) !== undefined) {
    return [content];
  }

  return parseMarkdownIntoBlocks(content);
}
