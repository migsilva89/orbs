import { botAvatar, botInherit } from '@openbots/contracts/universal';
import type { DatabaseBot } from '../../types/database.types';
import type { Bot, BotCreateInput } from '@openbots/contracts/universal';

export function botRecord(row: DatabaseBot): Bot {
  return {
    ...row,
    avatar: botAvatar.nullable().parse(JSON.parse(row.avatar ?? 'null')),
    inherit: botInherit.parse(JSON.parse(row.inherit)),
  };
}

export function botValues(bot: BotCreateInput) {
  return {
    ...bot,
    avatar: JSON.stringify(bot.avatar),
    inherit: JSON.stringify(bot.inherit),
  };
}
