import { m } from '@openbots/i18n/client';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { ConnectCard } from '@/components/connect/connect-card';
import { connectionRead } from '@/services/connection/connection.client';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/connect')({
  head: () => seoHead({ title: m.connect_meta_title() }),
  beforeLoad: () => {
    if (connectionRead()) {
      throw redirect({ to: '/rooms' });
    }
  },
  component: ConnectCard,
});
