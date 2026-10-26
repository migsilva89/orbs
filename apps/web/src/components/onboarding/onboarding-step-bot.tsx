import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { botDefaultSettings } from '@repo/client/client';
import { useBotCreate } from '@repo/client/react';
import { botForm } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { BotFormAvatar } from '@/components/bots/bot-form-avatar';
import { BotFormModel } from '@/components/bots/bot-form-model';
import { BotFormProfile } from '@/components/bots/bot-form-profile';
import { BotPermissionSelect } from '@/components/bots/bot-permission-select';
import { OnboardingSceneBot } from '@/components/onboarding/onboarding-scene-bot';
import { OnboardingStepLayout } from '@/components/onboarding/onboarding-step-layout';
import { Button } from '@/components/ui/button';
import { ButtonLoading } from '@/components/ui/button-loading';
import { Form, FormErrors, FormField, FormItem, FormLabel } from '@/components/ui/forms/form';
import { rpc } from '@/services/rpc/rpc.client';

export function OnboardingStepBot() {
  const navigate = useNavigate();
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const { data: tools } = useSuspenseQuery(rpc.tools.settings.queryOptions());
  const { data: models } = useQuery({ ...rpc.models.list.queryOptions(), retry: false });
  const settings = botDefaultSettings({ models: models ?? [], thinkingLevel: 'medium' });

  const form = useForm({
    resolver: standardSchemaResolver(botForm),
    resetOptions: { keepDirtyValues: true },
    values: {
      avatar: null,
      fallbackModel: null,
      name: m.rooms_bot_default_name(),
      handle: '',
      instructions: '',
      ...settings,
      permission: tools.isJevConfigured ? 'auto' : 'ask',
    },
  });

  const create = useBotCreate({
    onCreated: (bot) => void navigate({
      to: '/onboarding/$step',
      params: { step: 'done' },
      search: { handle: bot.handle },
    }),
  });

  return (
    <Form {...form}>
      <OnboardingStepLayout
        actions={(
          <>
            {bots.length > 0 ? (
              <Button
                disabled={create.isPending}
                variant="ghost"
                onClick={() => void navigate({ to: '/onboarding/$step', params: { step: 'done' } })}
              >
                {m.onboarding_skip()}
              </Button>
            ) : null}
            <ButtonLoading
              disabled={create.isPending}
              form="onboarding-bot"
              loading={create.isPending}
              type="submit"
            >
              {m.rooms_bot_submit()}
            </ButtonLoading>
          </>
        )}
        back="approvals"
        description={bots.length > 0 ? m.onboarding_bot_description_existing() : m.onboarding_bot_description()}
        scene={<OnboardingSceneBot />}
        title={m.onboarding_bot_title()}
      >
        <form
          className="flex flex-col gap-4"
          id="onboarding-bot"
          onSubmit={form.handleSubmit(create.create)}
        >
          <fieldset className="contents" disabled={create.isPending}>
            <BotFormAvatar busy={create.isPending} />
            <BotFormProfile />
            <BotFormModel busy={create.isPending} />
            <FormField
              control={form.control}
              name="permission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{m.rooms_bot_permission()}</FormLabel>
                  <BotPermissionSelect
                    disabled={create.isPending}
                    value={field.value ?? 'ask'}
                    onChange={field.onChange}
                  />
                </FormItem>
              )}
            />
            <FormErrors error={create.problem} />
          </fieldset>
        </form>
      </OnboardingStepLayout>
    </Form>
  );
}
