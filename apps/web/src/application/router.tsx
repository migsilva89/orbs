import { bootZodErrors } from '@openbots/i18n/validation';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { tanstackQueryContext } from '@/services/tanstack/tanstack.client';
import { routeTree } from './routes.tree';

bootZodErrors();

export function getRouter() {
  const context = tanstackQueryContext();

  return createTanStackRouter({
    routeTree,
    context,
    Wrap: ({ children }) => <QueryClientProvider client={context.queryClient}>{children}</QueryClientProvider>,
    search: {
      strict: true,
    },
    trailingSlash: 'never',
    defaultPreload: 'intent',
    scrollRestoration: ({ location }) => !location.pathname.startsWith('/rooms'),
    defaultPreloadStaleTime: 0,
    defaultStructuralSharing: true,
  });
}
