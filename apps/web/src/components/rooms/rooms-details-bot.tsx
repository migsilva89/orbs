import { BOT_PERMISSION_LABELS, BOT_THINKING_LEVEL_LABELS, ROOMS_SEND_MODE_DEFAULT, ROOMS_SEND_MODES } from '@repo/client/client';
import { useBotUpdate, useChatSettings } from '@repo/client/react';
import { botFields, conversationWhenBusy } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { Item, ItemActions, ItemContent, ItemGroup, ItemLink, ItemMedia, ItemTitle, ItemValue } from '@repo/ui/item';
import { RoomsDetailsSection } from '@repo/ui/rooms/rooms-details-section';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { SettingsProviderLogo } from '@repo/ui/settings/settings-provider-logo';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { rpc } from '@/services/rpc/rpc.client';
import IconChevronRight from '~icons/lucide/chevron-right';
import IconListOrdered from '~icons/lucide/list-ordered';
import IconSettings2 from '~icons/lucide/settings-2';
import IconShieldCheck from '~icons/lucide/shield-check';
import type { RoomsChat } from '@repo/client/client';
import type { Bot } from '@repo/contracts/universal';

interface RoomsDetailsBotProps {
  bot: Bot
  chat: RoomsChat
}

export function RoomsDetailsBot({ bot, chat }: RoomsDetailsBotProps) {
  const { data: models = [] } = useQuery({ ...rpc.models.list.queryOptions(), retry: false });
  const model = models.find((item) => item.provider === bot.modelProvider && item.id === bot.modelId);
  const settings = useChatSettings(bot.id);
  const update = useBotUpdate();

  return (
    <RoomsDetailsSection title={m.bots_settings()}>
      <ItemGroup variant="outline">
        <Item size="sm">
          <ItemMedia>
            <SettingsProviderLogo providerId={bot.modelProvider} />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle className="w-full truncate">{model?.name ?? bot.modelId}</ItemTitle>
          </ItemContent>
          <ItemActions>
            <ItemValue>{BOT_THINKING_LEVEL_LABELS[bot.thinkingLevel]()}</ItemValue>
          </ItemActions>
        </Item>
        <Item size="sm">
          <ItemMedia>
            <IconListOrdered />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle>{m.rooms_action_send_mode()}</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Select
              disabled={settings.isSendModePending}
              value={chat.whenBusy ?? ROOMS_SEND_MODE_DEFAULT}
              onValueChange={(value) => settings.setSendMode(value === ROOMS_SEND_MODE_DEFAULT ? null : conversationWhenBusy.parse(value))}
            >
              <SelectTrigger
                aria-label={m.rooms_action_send_mode()}
                className="-mr-2 h-6"
                variant="ghost"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value={ROOMS_SEND_MODE_DEFAULT}>
                  {settings.defaultSendModeLabel}
                </SelectItem>
                {conversationWhenBusy.options.map((mode) => <SelectItem key={mode} value={mode}>{ROOMS_SEND_MODES[mode]()}</SelectItem>)}
              </SelectContent>
            </Select>
          </ItemActions>
        </Item>
        <Item size="sm">
          <ItemMedia>
            <IconShieldCheck />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle>{m.rooms_bot_permission()}</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Select
              disabled={update.isPending}
              value={bot.permission}
              onValueChange={(value) => update.mutate({ botId: bot.id, permission: botFields.shape.permission.parse(value) })}
            >
              <SelectTrigger
                aria-label={m.rooms_bot_permission()}
                className="-mr-2 h-6"
                variant="ghost"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {botFields.shape.permission.options.map((option) => <SelectItem key={option} value={option}>{BOT_PERMISSION_LABELS[option]()}</SelectItem>)}
              </SelectContent>
            </Select>
          </ItemActions>
        </Item>
        <Item size="sm">
          <ItemMedia>
            <IconSettings2 />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle>
              <ItemLink asChild>
                <Link params={{ botId: bot.id }} to="/bots/$botId">{m.rooms_details_more()}</Link>
              </ItemLink>
            </ItemTitle>
          </ItemContent>
          <ItemActions>
            <ItemValue><IconChevronRight /></ItemValue>
          </ItemActions>
        </Item>
      </ItemGroup>
    </RoomsDetailsSection>
  );
}
