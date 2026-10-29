import { botSection } from '@repo/contracts/universal';
import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/_chat/bots/$botId/$tab')({
  beforeLoad: ({ params }) => {
    if (!botSection.safeParse(params.tab).success) {
      throw notFound();
    }
  },
});
