import { roomsFold, roomsSidebarOrder } from '@repo/client/client';
import { getLocale, m } from '@repo/i18n/client';
import { match } from 'ts-pattern';
import type { BotHomeSection, BotHomeSectionsParams } from '@/types/bot-home.types';

export function botHomeSections({ chats, sections: sidebarSections, search }: BotHomeSectionsParams) {
  const needle = roomsFold(search.trim());

  const { pinned, sections, others, hidden } = roomsSidebarOrder({
    chats: chats.filter((chat) => roomsFold(chat.name).includes(needle)),
    sections: sidebarSections,
  });

  const featured = match(needle).with('', () => pinned[0]).otherwise(() => undefined);

  const groups: BotHomeSection[] = [
    { key: 'pinned', title: m.rooms_pinned(), data: pinned.filter((chat) => chat !== featured) },
    ...sections.map((section) => ({ key: `section:${section.id}` as const, title: section.name, data: section.chats, section })),
    { key: 'others', title: m.rooms_meta_title(), data: others },
    { key: 'hidden', title: m.rooms_hidden(), data: hidden },
  ];

  return { featured, sections: groups.filter((section) => section.data.length > 0 || (section.section && !needle)) };
}

export function botHomeTime(createdAt: number, now = new Date()): string {
  const date = new Date(createdAt);
  const isToday = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();

  const options: Intl.DateTimeFormatOptions = match(isToday)
    .with(true, () => ({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } as const))
    .with(false, () => ({ weekday: 'long' } as const))
    .exhaustive();

  return new Intl.DateTimeFormat(getLocale(), options).format(date);
}
