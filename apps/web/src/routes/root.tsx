import { connectionLostReason } from '@repo/client/client';
import { createFaviconLinks, createMetadata } from '@repo/tanstack-helpers/universal';
import { createRootRouteWithContext, redirect } from '@tanstack/react-router';
import { match, P } from 'ts-pattern';
import { LayoutRootDocument, LayoutRootError, LayoutRootNotFound } from '@/components/layout/layout-root';
import { connectionForget, connectionLearn, connectionRead } from '@/services/connection/connection.client';
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
      const info = await context.queryClient.ensureQueryData(rpc.server.info.queryOptions());
      await connectionLearn(connection, info.addresses);

      return {
        connection: {
          deviceId: connection.deviceId,
          serverId: connection.serverId,
          addresses: connection.addresses,
        },
      };
    } catch (error) {
      return match(connectionLostReason(error))
        .with(P.nonNullable, async (reason) => {
          await connectionForget();
          context.queryClient.clear();

          throw redirect({ to: '/connect', search: { reason } });
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
