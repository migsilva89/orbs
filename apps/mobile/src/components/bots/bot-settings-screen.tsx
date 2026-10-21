import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useBotUpdate } from '@openbots/client/react';
import { botForm } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { Stack, usePreventRemove, useRouter } from 'expo-router';
import { CalendarClock, ListTodo, ScrollText, Trash2 } from 'lucide-react-native';
import { FormProvider, useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { match, P } from 'ts-pattern';
import { useCSSVariable } from 'uniwind';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { BotLoadState } from '@/components/bots/bot-load-state';
import { BotSettingsAccess } from '@/components/bots/bot-settings-access';
import { BotSettingsModel } from '@/components/bots/bot-settings-model';
import { BotSettingsProfile } from '@/components/bots/bot-settings-profile';
import { RoutinesList } from '@/components/routines/routines-list';
import { TodosList } from '@/components/todos/todos-list';
import { actionSheetShow } from '@/components/ui/action-sheet';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Icon } from '@/components/ui/icon';
import { useChatReturn } from '@/hooks/use-chat-return';
import { useConnection } from '@/hooks/use-connection';
import type { RpcSession } from '@/types/rpc.types';
import type { Bot, BotForm } from '@openbots/contracts/universal';

interface BotSettingsScreenProps {
  botId: string;
}

export function BotSettingsScreen({ botId }: BotSettingsScreenProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <BotSettingsScreenLoader botId={botId} session={current} />)
    .otherwise(() => null);
}

interface BotSettingsScreenLoaderProps {
  session: RpcSession;
  botId: string;
}

function BotSettingsScreenLoader({ session, botId }: BotSettingsScreenLoaderProps) {
  const bots = useQuery(session.rpc.bots.list.queryOptions());

  return match(bots.data?.find((item) => item.id === botId))
    .with(P.nonNullable, (bot) => (
      <BotSettingsScreenForm
        bot={bot}
        isDeletable={(bots.data?.length ?? 0) > 1}
        key={bot.id}
        session={session}
      />
    ))
    .otherwise(() => (
      <BotLoadState
        isError={bots.isError}
        isMissing={bots.isSuccess}
        onRetry={() => void bots.refetch()}
      />
    ));
}

interface BotSettingsScreenFormProps {
  session: RpcSession;
  bot: Bot;
  isDeletable: boolean;
}

function BotSettingsScreenForm({ session, bot, isDeletable }: BotSettingsScreenFormProps) {
  const router = useRouter();
  const returnToChat = useChatReturn();
  const [primary, primaryForeground] = useCSSVariable(['--color-primary', '--color-primary-foreground']).map(String);

  const form = useForm({
    resolver: standardSchemaResolver(botForm),
    resetOptions: { keepDirtyValues: true },
    values: {
      avatar: bot.avatar,
      fallbackModel: bot.fallbackModel,
      name: bot.name,
      handle: bot.handle,
      instructions: bot.instructions,
      modelProvider: bot.modelProvider,
      modelId: bot.modelId,
      thinkingLevel: bot.thinkingLevel,
      permission: bot.permission,
      inherit: bot.inherit,
    },
  });

  const { isDirty } = form.formState;

  const disablePrevention = usePreventRemove(isDirty, ({ repeat }) => actionSheetShow({
    title: m.mobile_bot_discard_title(),
    cancelLabel: m.mobile_bot_keep_editing(),
    choices: [{
      label: m.mobile_bot_discard(),
      isDestructive: true,
      onSelect: () => {
        form.reset();
        repeat();
      },
    }],
  }));

  const save = useBotUpdate(m.bots_saved());

  const isBusy = save.isPending;
  const prefill = (text: string) => returnToChat({ botId: bot.id, prefill: text });

  const submit = form.handleSubmit((input: BotForm) => save.mutate({
    ...input,
    handle: input.handle === '' ? bot.handle : input.handle,
    botId: bot.id,
  }, {
    onSuccess: () => {
      disablePrevention();
      form.reset(form.getValues());
      router.back();
    },
  }));

  return (
    <FormProvider {...form}>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          disabled={!isDirty || isBusy}
          style={{ color: primaryForeground }}
          tintColor={primary}
          variant="done"
          onPress={() => void submit()}
        >
          {m.rooms_bot_save()}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <View className="flex-1 bg-background">
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerClassName="gap-6 px-4 pt-4 pb-12"
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <BotSettingsProfile isDisabled={isBusy} />
          <BotDetailsSection
            icon={ScrollText}
            title={m.rooms_bot_instructions()}
          >
            <View className="rounded-lg border border-border bg-card p-4">
              <FormField
                isLabelHidden
                multiline
                control={form.control}
                editable={!isBusy}
                label={m.rooms_bot_instructions()}
                maxLength={16000}
                name="instructions"
                placeholder={m.rooms_bot_instructions_placeholder()}
              />
            </View>
          </BotDetailsSection>
          <BotSettingsModel isDisabled={isBusy} session={session} />
          <BotSettingsAccess isDisabled={isBusy} />
          <BotDetailsSection
            icon={ListTodo}
            title={m.rooms_todos()}
          >
            <TodosList
              bot={bot}
              session={session}
              onPrefill={prefill}
            />
          </BotDetailsSection>
          <BotDetailsSection
            icon={CalendarClock}
            title={m.rooms_routines()}
          >
            <RoutinesList
              bot={bot}
              session={session}
              onPrefill={prefill}
            />
          </BotDetailsSection>
          {isDeletable ? (
            <Button
              disabled={isBusy || isDirty}
              size="sm"
              variant="link-destructive"
              onPress={() => router.push({ pathname: '/bots/[botId]/delete', params: { botId: bot.id } })}
            >
              <Icon icon={Trash2} size="sm" />
              {m.rooms_bot_delete()}
            </Button>
          ) : null}
        </ScrollView>
      </View>
    </FormProvider>
  );
}
