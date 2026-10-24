export interface BotAvatarRouteParams extends Record<string, string | string[] | undefined> {
  avatarEmoji?: string;
}

export type BotAvatarFormRoute = 'bots/create' | 'bots/[botId]/edit';
