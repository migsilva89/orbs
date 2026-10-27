import { htmlReplyContent } from '@repo/client/client';
import { parseMarkdownIntoBlocks } from 'streamdown';

export function htmlReplyPage(content: string): boolean {
  return htmlReplyContent(content) !== undefined && htmlReplyBlocks(content).length === 1;
}

export function htmlReplyBlocks(content: string): string[] {
  if (content.trimStart().startsWith('<') && htmlReplyContent(content) !== undefined) {
    return [content];
  }

  return parseMarkdownIntoBlocks(content);
}
