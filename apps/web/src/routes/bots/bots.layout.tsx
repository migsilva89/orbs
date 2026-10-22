import { m } from '@repo/i18n/client';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_chat/bots')({
  loader: () => ({ breadcrumb: m.bots_title() }),
  component: Outlet,
});
