import { bootZodErrors } from '@repo/i18n/validation';
import { LayoutError, LayoutNotFound } from '@repo/ui/layout/layout-error';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { tanstackQueryContext } from '@/services/tanstack/tanstack.client';
import { routeTree } from './routes.tree';

bootZodErrors();

export function getRouter() {
  const context = tanstackQueryContext();

  const router = createTanStackRouter({
    routeTree,
    context,
    search: {
      strict: true,
    },
    trailingSlash: 'never',
    defaultPreload: 'intent',
    scrollRestoration: ({ location }) => !location.pathname.startsWith('/rooms'),
    defaultPreloadStaleTime: 0,
    defaultStructuralSharing: true,
    defaultErrorComponent: LayoutError,
    defaultNotFoundComponent: LayoutNotFound,
    notFoundMode: 'root',
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient: context.queryClient,
  });

  return router;
}
