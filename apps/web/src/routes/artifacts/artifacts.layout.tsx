import { m } from '@repo/i18n/client';
import { LayoutNotFound } from '@repo/ui/layout/layout-error';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_chat/artifacts')({
  loader: () => ({ breadcrumb: m.artifacts_title() }),
  component: Outlet,
  notFoundComponent: LayoutNotFound,
});
