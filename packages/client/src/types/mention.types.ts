export interface MentionTarget {
  kind: 'skill' | 'command';
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

export type MentionSegment = { kind: 'text', text: string } | { kind: 'pill', item: { href: string, label: string } };
