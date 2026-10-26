import { useRpc } from '@repo/client/react';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';

export function useOnboardingGate() {
  const { rpc } = useRpc();
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useQuery(rpc.onboarding.state.queryOptions());
  const isPending = data?.completedAt === null && !pathname.startsWith('/onboarding');

  useEffect(() => {
    if (isPending) {
      router.replace({ pathname: '/onboarding/[step]', params: { step: 'welcome' } });
    }
  }, [isPending, router]);
}
