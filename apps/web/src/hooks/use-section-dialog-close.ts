import { useCanGoBack, useRouter } from '@tanstack/react-router';

export function useSectionDialogClose() {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return () => (canGoBack ? router.history.back() : void router.navigate({ to: '/rooms' }));
}
