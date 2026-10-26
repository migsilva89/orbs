import { useRpc } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bell, MessageCircle, Wrench } from 'lucide-react-native';
import { OnboardingSceneDone } from '@/components/onboarding/onboarding-scene-done';
import { OnboardingStepLayout } from '@/components/onboarding/onboarding-step-layout';
import { OnboardingStepList } from '@/components/onboarding/onboarding-step-list';
import { Button } from '@/components/ui/button';
import { LabelDescription } from '@/components/ui/label';
import type { OnboardingRouteParams } from '@/types/onboarding.types';
import type { Bot } from '@repo/contracts/universal';

export function OnboardingStepDone() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { rpc } = useRpc();
  const { handle } = useLocalSearchParams<OnboardingRouteParams>();
  const { data: bots = [] } = useQuery(rpc.bots.list.queryOptions());
  const latest = bots.reduce<Bot | undefined>((found, item) => (!found || item.createdAt > found.createdAt ? item : found), undefined);
  const bot = bots.find((item) => item.handle === handle) ?? latest;

  const complete = useMutation(rpc.onboarding.complete.mutationOptions({
    onSuccess: async (state) => {
      const queryKey = rpc.onboarding.state.queryKey();
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData(queryKey, state);
      router.dismissAll();
      router.replace('/');

      if (bot) {
        router.push({ pathname: '/chat/[botId]', params: { botId: bot.id } });
      }
    },
  }));

  return (
    <OnboardingStepLayout
      description={bot ? m.onboarding_done_description({ bot: bot.name }) : m.onboarding_done_description_no_bot()}
      hasBack={!handle}
      primary={(
        <Button
          className="w-full"
          disabled={complete.isPending}
          loading={complete.isPending}
          size="lg"
          onPress={() => complete.mutate()}
        >
          {bot ? m.onboarding_done_open() : m.onboarding_done_rooms()}
        </Button>
      )}
      scene={<OnboardingSceneDone bot={bot} />}
      step="done"
      title={m.onboarding_done_title()}
    >
      <OnboardingStepList
        items={[
          { icon: MessageCircle, label: m.onboarding_done_next_chat() },
          { icon: Wrench, label: m.onboarding_done_next_customize() },
          { icon: Bell, label: m.onboarding_done_next_notify() },
        ]}
      />
      {complete.isError ? <LabelDescription accessibilityRole="alert" variant="error">{m.onboarding_done_error()}</LabelDescription> : null}
    </OnboardingStepLayout>
  );
}
