import { MENTION } from './mention.constants';
import type * as MentionTypes from '../../types/mention.types';

export function mentionHref({ kind, name }: MentionTypes.MentionTarget): string {
  return `${kind}:${encodeURIComponent(name)}`;
}

export function mentionTarget({ href }: MentionTypes.MentionHrefParams): MentionTypes.MentionTarget | undefined {
  const [, kind, name] = MENTION.target.exec(href) ?? [];

  return (kind === 'skill' || kind === 'command') && name ? { kind, name: decodeURIComponent(name) } : undefined;
}

export function mentionSegments({ text }: MentionTypes.MentionTextParams): MentionTypes.MentionSegment[] {
  const segments: MentionTypes.MentionSegment[] = [];
  let index = 0;

  for (const link of text.matchAll(MENTION.link)) {
    segments.push({ kind: 'text', text: text.slice(index, link.index) }, { kind: 'pill', item: { href: link[2], label: link[1] } });
    index = link.index + link[0].length;
  }

  return [...segments, { kind: 'text', text: text.slice(index) }];
}

export function mentionSubmission({ text }: MentionTypes.MentionTextParams): MentionTypes.MentionSubmission {
  const targets = [...text.matchAll(MENTION.link)].flatMap((link) => {
    const target = mentionTarget({ href: link[2] });

    return target ? [{ ...target, start: link.index, end: link.index + link[0].length }] : [];
  });

  const command = targets.find((target) => target.kind === 'command' && text.slice(0, target.start).trim() === '');
  const content = text.replaceAll(MENTION.link, (link, _label, href: string) => (mentionTarget({ href })?.kind === 'skill' ? '' : link)).trim();

  return {
    content: command ? '' : content,
    skills: targets.filter((target) => target.kind === 'skill').map((target) => target.name),
    command: command ? { name: command.name, arguments: text.slice(command.end).trim() } : undefined,
  };
}
