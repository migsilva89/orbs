export const MENTION = {
  link: /\[([^\]]*)\]\(((?:skill|command|bot|quote):[^)\s]+)\)/gu,
  target: /^(skill|command|bot|quote):(.+)$/u,
  quoteMaxChars: 200,
} as const;
