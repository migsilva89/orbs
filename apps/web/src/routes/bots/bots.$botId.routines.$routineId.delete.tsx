import { createFileRoute, notFound } from '@tanstack/react-router';
import { rpc } from '@/services/rpc/rpc.client';

export const Route = createFileRoute('/_chat/bots/$botId/routines/$routineId/delete')({
  loader: async ({ context, params }) => {
    const routines = await context.queryClient.ensureQueryData(rpc.routines.list.queryOptions({ input: { botId: params.botId } }));

    if (!routines.some((item) => item.id === params.routineId)) {
      throw notFound();
    }
  },
});
