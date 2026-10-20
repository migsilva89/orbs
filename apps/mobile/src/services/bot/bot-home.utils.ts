import { roomsFold, roomsSidebarOrder } from '@openbots/client/client';
import { getLocale, m } from '@openbots/i18n/client';
import { match } from 'ts-pattern';
import type { BotHomeSection, BotHomeSectionsParams } from '@/types/bot-home.types';

export function botHomeSections({ chats, search }: BotHomeSectionsParams) {
  const needle = roomsFold(search.trim());
  const { pinned, others, hidden } = roomsSidebarOrder({ chats: chats.filter((chat) => roomsFold(chat.name).includes(needle)) });
  const featured = match(needle).with('', () => pinned[0]).otherwise(() => undefined);

  const sections: BotHomeSection[] = [
    { key: 'pinned', title: m.rooms_pinned(), data: pinned.filter((chat) => chat !== featured) },
    { key: 'others', title: m.rooms_meta_title(), data: others },
    { key: 'hidden', title: m.rooms_hidden(), data: hidden },
  ];

  return { featured, sections: sections.filter((section) => section.data.length > 0) };
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
