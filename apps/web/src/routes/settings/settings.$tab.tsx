import { settingsSection } from '@repo/contracts/universal';
import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/_chat/settings/$tab')({
  beforeLoad: ({ params }) => {
    if (!settingsSection.safeParse(params.tab).success) {
      throw notFound();
    }
  },
});
