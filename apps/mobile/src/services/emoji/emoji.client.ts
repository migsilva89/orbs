import { queryOptions } from '@tanstack/react-query';
import { EMOJI } from './emoji.constants';
import type { EmojiItem, EmojiSearchParams } from '@/types/emoji.types';

export function emojiListOptions() {
  return queryOptions({
    queryKey: ['emoji', EMOJI.dataUrl],
    queryFn: async ({ signal }) => {
      const response = await fetch(EMOJI.dataUrl, { signal });
      const items: EmojiItem[] = await response.json();

      return items.filter((item) => item.group !== undefined && item.group !== EMOJI.componentGroup);
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function emojiSearch({ items, query }: EmojiSearchParams): EmojiItem[] {
  const needle = query.trim().toLowerCase();

  return needle ? items.filter((item) => item.label.includes(needle) || item.tags?.some((tag) => tag.includes(needle))) : items;
}
