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
