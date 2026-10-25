import { connectSearch } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { ConnectCard } from '@/components/connect/connect-card';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/connect')({
  head: () => seoHead({ title: m.connect_meta_title() }),
  validateSearch: connectSearch,
  beforeLoad: ({ context }) => {
    if (context.connection) {
      throw redirect({ to: '/rooms' });
    }
  },
  component: ConnectCard,
});
