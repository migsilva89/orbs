import { createFaviconLinks, createMetadata } from '@openbots/tanstack-helpers/universal';
import { ORPCError } from '@orpc/client';
import { createRootRouteWithContext } from '@tanstack/react-router';
import { match, P } from 'ts-pattern';
import { LayoutRootDocument, LayoutRootError, LayoutRootNotFound } from '@/components/layout/layout-root';
import { connectionForget, connectionRead } from '@/services/connection/connection.client';
import { rpc } from '@/services/rpc/rpc.client';
import { SEO_METADATA_DEFAULTS } from '@/services/seo/seo.constants';
import appCss from '../application/styles.css?url';
import type { RouterContext } from '@/types/router.types';

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    const connection = await connectionRead();

    if (!connection) {
      return { connection: null };
    }

    try {
      await context.queryClient.ensureQueryData(rpc.server.info.queryOptions());

      return {
        connection: {
          deviceId: connection.deviceId,
          serverId: connection.serverId,
          serverUrl: connection.serverUrl,
        },
      };
    } catch (error) {
      return match(error)
        .with(P.intersection(P.instanceOf(ORPCError), { code: P.union('UNAUTHORIZED', 'SERVER_MISMATCH') }), async () => {
          await connectionForget();
          context.queryClient.clear();

          return { connection: null };
        })
        .otherwise(() => {
          throw error;
        });
    }
  },
  head: () => ({
    meta: createMetadata({ defaults: SEO_METADATA_DEFAULTS }),
    links: [
      { rel: 'stylesheet', href: appCss },
      ...createFaviconLinks(),
    ],
  }),
  shellComponent: LayoutRootDocument,
  errorComponent: LayoutRootError,
  notFoundComponent: LayoutRootNotFound,
});
