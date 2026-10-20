import { BOT_PERMISSION_LABELS, BOT_THINKING_LEVEL_LABELS, ROOMS_SEND_MODES } from '@openbots/client/client';
import { botFields, conversationWhenBusy } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Cpu, ListOrdered, ShieldCheck } from 'lucide-react-native';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { actionSheetShow } from '@/components/ui/action-sheet';
import { Icon } from '@/components/ui/icon';
import { Item, ItemButton, ItemContent, ItemGroup, ItemMedia, ItemTitle, ItemValue } from '@/components/ui/item';
import { useToast } from '@/hooks/use-toast';
import type { RpcSession } from '@/types/rpc.types';
import type { Bot, ConversationListItem } from '@openbots/contracts/universal';

interface BotDetailsSettingsProps {
  session: RpcSession;
  bot: Bot;
  chat: ConversationListItem;
}

export function BotDetailsSettings({ session, bot, chat }: BotDetailsSettingsProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: models = [] } = useQuery({ ...session.rpc.models.list.queryOptions(), retry: false });
  const { data: settings } = useQuery(session.rpc.conversation.settings.queryOptions());
  const model = models.find((item) => item.provider === bot.modelProvider && item.id === bot.modelId);

  const setWhenBusy = useMutation(session.rpc.conversation.setWhenBusy.mutationOptions({
    onError: () => toast.show({ message: m.rooms_hide_failed() }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: session.rpc.conversation.list.key() }),
  }));

  const update = useMutation(session.rpc.bots.update.mutationOptions({
    onError: () => toast.show({ message: m.rooms_bot_save_error() }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: session.rpc.bots.list.key() }),
  }));

  const defaultMode = m.rooms_send_mode_default({ mode: settings ? ROOMS_SEND_MODES[settings.whenBusy]() : '…' });
  const sendMode = chat.whenBusy ? ROOMS_SEND_MODES[chat.whenBusy]() : defaultMode;

  const chooseSendMode = () => actionSheetShow({
    title: m.rooms_action_send_mode(),
    cancelLabel: m.ui_cancel(),
    choices: [
      { label: defaultMode, onSelect: () => setWhenBusy.mutate({ botId: bot.id, whenBusy: null }) },
      ...conversationWhenBusy.options.map((mode) => ({
        label: ROOMS_SEND_MODES[mode](),
        onSelect: () => setWhenBusy.mutate({ botId: bot.id, whenBusy: mode }),
      })),
    ],
  });

  const choosePermission = () => actionSheetShow({
    title: m.rooms_bot_permission(),
    cancelLabel: m.ui_cancel(),
    choices: botFields.shape.permission.options.map((permission) => ({
      label: BOT_PERMISSION_LABELS[permission](),
      onSelect: () => update.mutate({ botId: bot.id, permission }),
    })),
  });

  return (
    <BotDetailsSection title={m.bots_settings()}>
      <ItemGroup>
        <Item size="sm">
          <ItemMedia>
            <Icon icon={Cpu} tone="muted" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle numberOfLines={1}>{model?.name ?? bot.modelId}</ItemTitle>
          </ItemContent>
          <ItemValue>{BOT_THINKING_LEVEL_LABELS[bot.thinkingLevel]()}</ItemValue>
        </Item>
        <ItemButton
          accessibilityLabel={m.rooms_action_send_mode()}
          disabled={setWhenBusy.isPending}
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
      </ItemGroup>
    </BotDetailsSection>
  );
}
