import { m } from '@repo/i18n/client';
import { ButtonLoading } from '@repo/ui/button-loading';
import { FormErrors } from '@repo/ui/forms/form';
import { OnboardingStepLayout } from '@repo/ui/onboarding/onboarding-step-layout';
import { OnboardingStepList } from '@repo/ui/onboarding/onboarding-step-list';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { OnboardingSceneDone } from '@/components/onboarding/onboarding-scene-done';
import { rpc } from '@/services/rpc/rpc.client';
import IconMessageCircle from '~icons/lucide/message-circle';
import IconSmartphone from '~icons/lucide/smartphone';
import IconWrench from '~icons/lucide/wrench';
import type { Bot } from '@repo/contracts/universal';

export function OnboardingStepDone() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { handle } = useSearch({ from: '/_chat/onboarding/$step' });
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const latest = bots.reduce<Bot | undefined>((found, item) => (!found || item.createdAt > found.createdAt ? item : found), undefined);
  const bot = bots.find((item) => item.handle === handle) ?? latest;

  const complete = useMutation(rpc.onboarding.complete.mutationOptions({
    onSuccess: async (state) => {
      const queryKey = rpc.onboarding.state.queryKey();
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData(queryKey, state);
      await (bot
        ? navigate({ to: '/rooms/direct/$handle', params: { handle: bot.handle } })
        : navigate({ to: '/rooms' }));
    },
  }));

  return (
    <OnboardingStepLayout
      actions={(
        <ButtonLoading
          disabled={complete.isPending}
          loading={complete.isPending}
          onClick={() => complete.mutate()}
        >
          {bot ? m.onboarding_done_open() : m.onboarding_done_rooms()}
        </ButtonLoading>
      )}
      back={handle ? undefined : 'bot'}
      description={bot ? m.onboarding_done_description({ bot: bot.name }) : m.onboarding_done_description_no_bot()}
      scene={<OnboardingSceneDone bot={bot} />}
      title={m.onboarding_done_title()}
    >
      <OnboardingStepList
        items={[
          { icon: IconMessageCircle, label: m.onboarding_done_next_chat() },
          { icon: IconWrench, label: m.onboarding_done_next_customize() },
          { icon: IconSmartphone, label: m.onboarding_done_next_phone() },
        ]}
      />
      <FormErrors error={complete.isError ? m.onboarding_done_error() : null} />
    </OnboardingStepLayout>
  );
}
