import { onboardingSearch, onboardingStepParams } from '@repo/contracts/universal';
import { env } from '@repo/env/client';
import { m } from '@repo/i18n/client';
import { createFileRoute } from '@tanstack/react-router';
import { OnboardingPage } from '@/components/onboarding/onboarding-page';
import { rpc } from '@/services/rpc/rpc.client';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/_chat/onboarding/$step')({
  head: () => seoHead({ title: m.onboarding_title({ name: env.VITE_APP_NAME }) }),
  params: { parse: (params) => onboardingStepParams.parse(params) },
  validateSearch: onboardingSearch,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(rpc.providers.list.queryOptions()),
      context.queryClient.ensureQueryData(rpc.tools.settings.queryOptions()),
    ]);
  },
  component: OnboardingPage,
});
