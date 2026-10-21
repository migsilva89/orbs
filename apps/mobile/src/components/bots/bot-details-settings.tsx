import { BOT_PERMISSION_LABELS, BOT_THINKING_LEVEL_LABELS, botModelBrand, ROOMS_SEND_MODES } from '@openbots/client/client';
import { useBotUpdate, useChatSettings } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronRight, ListOrdered, PencilLine, ShieldCheck } from 'lucide-react-native';
import { BotBrandLogo } from '@/components/bots/bot-brand-logo';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { actionSheetShow } from '@/components/ui/action-sheet';
import { Icon } from '@/components/ui/icon';
import { Item, ItemButton, ItemContent, ItemGroup, ItemMedia, ItemTitle, ItemValue } from '@/components/ui/item';
import { botMenuPermissions, botMenuSendModes } from '@/services/bot/bot-menu.utils';
import type { RpcSession } from '@/types/rpc.types';
import type { Bot, ConversationListItem } from '@openbots/contracts/universal';

interface BotDetailsSettingsProps {
  session: RpcSession;
  bot: Bot;
  chat: ConversationListItem;
}

export function BotDetailsSettings({ session, bot, chat }: BotDetailsSettingsProps) {
  const router = useRouter();
  const { data: models = [] } = useQuery({ ...session.rpc.models.list.queryOptions(), retry: false });
  const model = models.find((item) => item.provider === bot.modelProvider && item.id === bot.modelId);

  const settings = useChatSettings(bot.id);
  const update = useBotUpdate();
  const sendMode = chat.whenBusy ? ROOMS_SEND_MODES[chat.whenBusy]() : settings.defaultSendModeLabel;

  const chooseSendMode = () => actionSheetShow({
    title: m.rooms_action_send_mode(),
    cancelLabel: m.ui_cancel(),
    choices: botMenuSendModes({
      defaultLabel: settings.defaultSendModeLabel,
      whenBusy: chat.whenBusy,
      onSelect: settings.setSendMode,
    }).map(({ label, onSelect }) => ({ label, onSelect: () => onSelect?.() })),
  });

  const choosePermission = () => actionSheetShow({
    title: m.rooms_bot_permission(),
    cancelLabel: m.ui_cancel(),
    choices: botMenuPermissions({
      permission: bot.permission,
      onSelect: (permission) => update.mutate({ botId: bot.id, permission }),
    }).map(({ label, onSelect }) => ({ label, onSelect: () => onSelect?.() })),
  });

  return (
    <BotDetailsSection title={m.bots_settings()}>
      <ItemGroup>
        <Item size="sm">
          <ItemMedia>
            <BotBrandLogo brand={botModelBrand({ providerId: bot.modelProvider, modelId: bot.modelId })} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle numberOfLines={1}>{model?.name ?? bot.modelId}</ItemTitle>
          </ItemContent>
          <ItemValue>{BOT_THINKING_LEVEL_LABELS[bot.thinkingLevel]()}</ItemValue>
        </Item>
        <ItemButton
          accessibilityLabel={m.rooms_action_send_mode()}
          disabled={settings.isSendModePending}
          size="sm"
          onPress={chooseSendMode}
        >
          <ItemMedia>
            <Icon icon={ListOrdered} tone="muted" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{m.rooms_action_send_mode()}</ItemTitle>
          </ItemContent>
          <ItemValue>{sendMode}</ItemValue>
        </ItemButton>
        <ItemButton
          accessibilityLabel={m.rooms_bot_permission()}
          disabled={update.isPending}
          size="sm"
          onPress={choosePermission}
        >
          <ItemMedia>
            <Icon icon={ShieldCheck} tone="muted" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{m.rooms_bot_permission()}</ItemTitle>
          </ItemContent>
          <ItemValue>{BOT_PERMISSION_LABELS[bot.permission]()}</ItemValue>
        </ItemButton>
        <ItemButton
          accessibilityLabel={m.rooms_action_edit_bot()}
          size="sm"
          onPress={() => {
            router.dismiss();
            router.push({ pathname: '/bots/[botId]/edit', params: { botId: bot.id } });
          }}
        >
          <ItemMedia>
            <Icon icon={PencilLine} tone="muted" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{m.rooms_action_edit_bot()}</ItemTitle>
          </ItemContent>
          <Icon
            icon={ChevronRight}
            size="sm"
            tone="muted"
          />
        </ItemButton>
      </ItemGroup>
    </BotDetailsSection>
  );
}
