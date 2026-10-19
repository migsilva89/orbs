import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { botForm } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Link, Outlet, useRouter } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { BotFormAccess } from '@/components/bots/bot-form-access';
import { BotFormAvatar } from '@/components/bots/bot-form-avatar';
import { BotFormInstructions } from '@/components/bots/bot-form-instructions';
import { BotFormModel } from '@/components/bots/bot-form-model';
import { BotFormProfile } from '@/components/bots/bot-form-profile';
import { LayoutPageHeader } from '@/components/layout/layout-page-header';
import { RoutinesPanel } from '@/components/routines/routines-panel';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { Button } from '@/components/ui/button';
import { ButtonLoading } from '@/components/ui/button-loading';
import { Form } from '@/components/ui/forms/form';
import { PanelFooter, PanelRow } from '@/components/ui/panel';
import { toasty } from '@/components/ui/sonner';
import { rpc } from '@/services/rpc/rpc.client';
import IconAtSign from '~icons/lucide/at-sign';
import IconBot from '~icons/lucide/bot';
import IconCpu from '~icons/lucide/cpu';
import IconMessageCircle from '~icons/lucide/message-circle';
import IconScrollText from '~icons/lucide/scroll-text';
import IconShieldCheck from '~icons/lucide/shield-check';
import IconSparkles from '~icons/lucide/sparkles';
import IconTrash from '~icons/lucide/trash-2';
import type { Bot, BotForm } from '@openbots/contracts/universal';

interface BotPageFormProps {
  bot: Bot
  deletable: boolean
}

function BotPageForm({ bot, deletable }: BotPageFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

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

  const save = useMutation(rpc.bots.update.mutationOptions({
    onSuccess: async (saved) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rpc.bots.list.key() }),
        queryClient.invalidateQueries({ queryKey: rpc.bots.catalog.key({ input: { botId: saved.id } }) }),
      ]);
      form.reset(form.getValues());
      await router.invalidate();
      toasty(m.bots_saved(), '✅');
    },
    onError: () => toasty(m.rooms_bot_save_error(), '🔴'),
  }));

  const busy = save.isPending;

  const footer = (
    <PanelFooter>
      <ButtonLoading
        disabled={busy || !form.formState.isDirty}
        loading={busy}
        size="sm"
        type="submit"
      >
        {m.rooms_bot_save()}
      </ButtonLoading>
    </PanelFooter>
  );

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-6"
        onSubmit={form.handleSubmit((input: BotForm) => save.mutate({
          ...input,
          handle: input.handle === '' ? bot.handle : input.handle,
          botId: bot.id,
        }))}
      >
        <fieldset className="contents" disabled={busy}>
          <SettingsPanel
            description={m.bots_profile_hint()}
            icon={IconBot}
            id="profile"
            title={m.bots_profile()}
          >
            <PanelRow className="justify-center">
              <BotFormAvatar busy={busy} />
            </PanelRow>
            <PanelRow className="items-start">
              <IconAtSign />
              <div className="min-w-0 flex-1">
                <BotFormProfile />
              </div>
            </PanelRow>
            {footer}
          </SettingsPanel>
          <SettingsPanel
            description={m.bots_instructions_hint()}
            icon={IconScrollText}
            id="instructions"
            title={m.rooms_bot_instructions()}
          >
            <BotFormInstructions />
            {footer}
          </SettingsPanel>
          <SettingsPanel
            description={m.bots_model_hint()}
            icon={IconCpu}
            id="model"
            title={m.rooms_bot_model()}
          >
            <PanelRow className="items-start">
              <IconSparkles />
              <div className="min-w-0 flex-1">
                <BotFormModel busy={busy} />
              </div>
            </PanelRow>
            {footer}
          </SettingsPanel>
          <SettingsPanel
            description={m.bots_access_hint()}
            icon={IconShieldCheck}
            id="access"
            title={m.bots_access()}
          >
            <BotFormAccess busy={busy} />
            {footer}
          </SettingsPanel>
        </fieldset>
      </form>
      <RoutinesPanel bot={bot} />
      {deletable ? (
        <Button
          asChild
          className="self-start"
          size="xs"
          variant="link-destructive"
        >
          <Link params={{ botId: bot.id }} to="/bots/$botId/delete">
            <IconTrash />
            {m.rooms_bot_delete()}
          </Link>
        </Button>
      ) : null}
    </Form>
  );
}

interface BotPageProps {
  botId: string
}

export function BotPage({ botId }: BotPageProps) {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const bot = bots.find((item) => item.id === botId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LayoutPageHeader>
        {bot ? (
          <Button
            asChild
            size="sm"
            variant="ghost"
          >
            <Link params={{ handle: bot.handle }} to="/rooms/direct/$handle">
              <IconMessageCircle />
              {m.bots_open_chat()}
            </Link>
          </Button>
        ) : null}
      </LayoutPageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
          {bot ? (
            <BotPageForm
              bot={bot}
              deletable={bots.length > 1}
              key={bot.id}
            />
          ) : null}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
