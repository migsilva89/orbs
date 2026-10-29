import { createFileRoute } from '@tanstack/react-router';
import { rpc } from '@/services/rpc/rpc.client';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/_chat/artifacts/$botId/$conversationId/$artifactId')({
  params: {
    parse: (raw) => ({ ...raw, conversationId: Number(raw.conversationId) }),
    stringify: (params) => ({ ...params, conversationId: String(params.conversationId) }),
  },
  loader: async ({ context, params }) => {
    const artifact = await context.queryClient.ensureQueryData(rpc.artifacts.get.queryOptions({ input: params }));

    return { breadcrumb: artifact.title };
  },
  head: ({ loaderData }) => seoHead({ title: loaderData?.breadcrumb }),
});

