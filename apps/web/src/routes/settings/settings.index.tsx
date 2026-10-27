import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_chat/settings/')({
  beforeLoad: () => {
    throw redirect({
      to: '/settings/$tab',
      params: { tab: 'general' },
      replace: true,
    });
  },
});
