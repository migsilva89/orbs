import { m } from '@openbots/i18n/client';
import { createFileRoute } from '@tanstack/react-router';
import { BotList } from '@/components/bots/bot-list';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/_chat/bots/')({
  head: () => seoHead({ title: m.bots_title() }),
  component: BotList,
});
