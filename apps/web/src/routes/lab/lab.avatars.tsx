import { m } from '@openbots/i18n/client';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { AvatarStudio } from '@/components/avatars/avatar-studio';
import { LayoutShellDashboard } from '@/components/layout/layout-shell-dashboard';
import { connectionRead } from '@/services/connection/connection.client';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/lab/avatars')({
  head: () => seoHead({ title: m.avatars_meta_title() }),
  beforeLoad: () => {
    if (!connectionRead()) {
      throw redirect({ to: '/connect' });
    }
  },
  loader: () => ({ breadcrumb: m.avatars_breadcrumb() }),
  component: LabAvatarsRoute,
});

function LabAvatarsRoute() {
  return (
    <LayoutShellDashboard>
      <AvatarStudio />
    </LayoutShellDashboard>
  );
}
