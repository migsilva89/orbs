import { m } from '@repo/i18n/client';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { OnboardingSceneDone } from '@/components/onboarding/onboarding-scene-done';
import { OnboardingStepLayout } from '@/components/onboarding/onboarding-step-layout';
import { ButtonLoading } from '@/components/ui/button-loading';
import { FormErrors } from '@/components/ui/forms/form';
import { rpc } from '@/services/rpc/rpc.client';

export function OnboardingStepDone() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { handle } = useSearch({ from: '/_chat/onboarding/$step' });
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const bot = bots.find((item) => item.handle === handle);

  const complete = useMutation(rpc.onboarding.complete.mutationOptions({
    onSuccess: async (state) => {
      queryClient.setQueryData(rpc.onboarding.state.queryKey(), state);
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
      back={bot ? undefined : 'bot'}
      description={bot ? m.onboarding_done_description({ bot: bot.name }) : m.onboarding_done_description_no_bot()}
      scene={<OnboardingSceneDone bot={bot} />}
      title={m.onboarding_done_title()}
    >
      <FormErrors error={complete.isError ? m.onboarding_done_error() : null} />
    </OnboardingStepLayout>
  );
}
