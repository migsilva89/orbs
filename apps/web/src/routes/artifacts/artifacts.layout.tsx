import { m } from '@openbots/i18n/client';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_chat/artifacts')({
  loader: () => ({ breadcrumb: m.artifacts_title() }),
  component: Outlet,
});
