import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_chat/bots/$botId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/bots/$botId/$tab',
      params: { botId: params.botId, tab: 'profile' },
      replace: true,
    });
  },
});
