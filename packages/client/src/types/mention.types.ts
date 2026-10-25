import type { Bot } from '@repo/contracts/universal';

export interface MentionTarget {
  kind: 'skill' | 'command' | 'bot' | 'quote';
  name: string;
}

export interface MentionHrefParams {
  href: string;
}

export interface MentionTextParams {
  text: string;
}

export interface MentionSubmission {
  content: string;
  skills: string[];
  command?: { name: string; arguments: string };
}

export type MentionSegment = { kind: 'text', text: string } | { kind: 'pill', item: MentionItem };

export interface MentionItem {
  href: string;
  label: string;
}

export interface MentionQueryParams {
  text: string;
  cursor: number;
}

export interface MentionQuery {
  char: string;
  query: string;
  start: number;
}

export interface MentionLinksParams {
  text: string;
  items: MentionItem[];
}

export interface MentionMarkdownParams {
  text: string;
  bots: Pick<Bot, 'id' | 'handle' | 'name'>[];
}

export interface MentionQuoteParams {
  text: string;
  entryId: number;
}
