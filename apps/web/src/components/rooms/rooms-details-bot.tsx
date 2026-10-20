import { BOT_PERMISSION_LABELS, BOT_THINKING_LEVEL_LABELS, ROOMS_SEND_MODE_DEFAULT, ROOMS_SEND_MODES } from '@openbots/client/client';
import { botFields, conversationWhenBusy } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { RoomsDetailsSection } from '@/components/rooms/rooms-details-section';
import { SettingsProviderLogo } from '@/components/settings/settings-provider-logo';
import { Item, ItemActions, ItemContent, ItemGroup, ItemLink, ItemMedia, ItemTitle, ItemValue } from '@/components/ui/item';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toasty } from '@/components/ui/sonner';
import { rpc } from '@/services/rpc/rpc.client';
import IconChevronRight from '~icons/lucide/chevron-right';
import IconListOrdered from '~icons/lucide/list-ordered';
import IconSettings2 from '~icons/lucide/settings-2';
import IconShieldCheck from '~icons/lucide/shield-check';
import type { RoomsChat } from '@openbots/client/client';
import type { Bot } from '@openbots/contracts/universal';

interface RoomsDetailsBotProps {
  bot: Bot
  chat: RoomsChat
}

export function RoomsDetailsBot({ bot, chat }: RoomsDetailsBotProps) {
  const queryClient = useQueryClient();
  const { data: models = [] } = useQuery({ ...rpc.models.list.queryOptions(), retry: false });
  const { data: settings } = useQuery(rpc.conversation.settings.queryOptions());
  const model = models.find((item) => item.provider === bot.modelProvider && item.id === bot.modelId);
  const setWhenBusy = useMutation(rpc.conversation.setWhenBusy.mutationOptions({ onError: () => toasty(m.rooms_hide_failed(), '⚠️') }));

  const update = useMutation(rpc.bots.update.mutationOptions({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rpc.bots.list.key() }),
    onError: () => toasty(m.rooms_bot_save_error(), '🔴'),
  }));

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
              disabled={setWhenBusy.isPending}
              value={chat.whenBusy ?? ROOMS_SEND_MODE_DEFAULT}
              onValueChange={(value) => setWhenBusy.mutate({
                botId: bot.id,
                whenBusy: value === ROOMS_SEND_MODE_DEFAULT ? null : conversationWhenBusy.parse(value),
              })}
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
                  {m.rooms_send_mode_default({ mode: settings ? ROOMS_SEND_MODES[settings.whenBusy]() : '…' })}
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
