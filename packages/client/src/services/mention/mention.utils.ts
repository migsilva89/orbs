import { MENTION } from './mention.constants';
import type * as MentionTypes from '../../types/mention.types';

export function mentionHref({ kind, name }: MentionTypes.MentionTarget): string {
  return `${kind}:${encodeURIComponent(name)}`;
}

export function mentionTarget({ href }: MentionTypes.MentionHrefParams): MentionTypes.MentionTarget | undefined {
  const [, kind, name] = MENTION.target.exec(href) ?? [];

  return (kind === 'skill' || kind === 'command' || kind === 'bot' || kind === 'quote') && name ? { kind, name: decodeURIComponent(name) } : undefined;
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

export function mentionHandle(handle: string): RegExp {
  const notInsideAWord = String.raw`(?<![\p{L}\p{N}_.-])`;
  const notInsideALongerHandle = String.raw`(?![\p{L}\p{N}_-])`;

  return new RegExp(`${notInsideAWord}@${handle}${notInsideALongerHandle}`, 'iu');
}

export function mentionQuery({ text, cursor }: MentionTypes.MentionQueryParams): MentionTypes.MentionQuery | undefined {
  const typed = /(?:^|\s)([@$/])([^\s@$/]*)$/u.exec(text.slice(0, cursor));

  return typed?.[1] ? { char: typed[1], query: typed[2], start: cursor - typed[2].length - 1 } : undefined;
}

export function mentionLinks({ text, items }: MentionTypes.MentionLinksParams): string {
  return items.reduce((value, item) => {
    const label = new RegExp(`(?<!\\S)${item.label.replaceAll(/[$()*+./?[\\\]^{|}]/gu, String.raw`\$&`)}(?!\\S)`, 'gu');

    return value.replace(label, `[${item.label}](${item.href})`);
  }, text);
}

export function mentionMarkdown({ text, bots }: MentionTypes.MentionMarkdownParams): string {
  if (bots.length === 0) {
    return text;
  }

  const byId = new Map(bots.map((bot) => [bot.id, bot]));
  const byHandle = new Map(bots.map((bot) => [bot.handle, bot]));
  const handles = new RegExp(mentionHandle(`(?:${[...byHandle.keys()].join('|')})`).source, 'giu');

  return text.split(/(```[\s\S]*?```|`[^`\n]*`)/u).map((part, index) => (index % 2 === 1 ? part : part
    .replaceAll(MENTION.link, (link, _label, href: string) => {
      const target = mentionTarget({ href });
      const bot = target?.kind === 'bot' ? byId.get(target.name) : undefined;

      return bot ? `[${bot.name}](${href})` : link;
    })
    .replaceAll(handles, (handle) => {
      const bot = byHandle.get(handle.slice(1).toLowerCase());

      return bot ? `[${bot.name}](${mentionHref({ kind: 'bot', name: bot.id })})` : handle;
    }))).join('');
}

export function mentionQuote({ text, entryId }: MentionTypes.MentionQuoteParams): MentionTypes.MentionItem {
  return {
    href: mentionHref({ kind: 'quote', name: String(entryId) }),
    label: `“${text.replaceAll(/[[\]\s]+/gu, ' ').trim().slice(0, MENTION.quoteMaxChars)}”`,
  };
}
