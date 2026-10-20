export interface EmojiItem {
  unicode: string;
  label: string;
  tags?: string[];
  group?: number;
}

export interface EmojiSearchParams {
  items: EmojiItem[];
  query: string;
}
