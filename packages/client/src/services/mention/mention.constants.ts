export const MENTION = {
  link: /\[([^\]]*)\]\(((?:skill|command):[^)\s]+)\)/gu,
  target: /^(skill|command):(.+)$/u,
} as const;
