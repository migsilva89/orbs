import { m } from '@repo/i18n/client';
import { getLocale } from '@repo/i18n/runtime';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@repo/ui/empty';
import { Item, ItemActions, ItemContent, ItemDescription, ItemLink, ItemMedia, ItemTitle, ItemValue } from '@repo/ui/item';
import { useSuspenseQueries, useSuspenseQuery } from '@tanstack/react-query';
import { Link, useHydrated } from '@tanstack/react-router';
import { LayoutPageHeader } from '@/components/layout/layout-page-header';
import { rpc } from '@/services/rpc/rpc.client';
import IconChevronRight from '~icons/lucide/chevron-right';

export function ArtifactList() {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());

  const artifacts = useSuspenseQueries({
    queries: bots.map((bot) => rpc.artifacts.listBot.queryOptions({ input: { botId: bot.id } })),
    combine: (results) => results.flatMap((result) => result.data).sort((left, right) => right.updatedAt - left.updatedAt),
  });

  const hydrated = useHydrated();
  const dates = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LayoutPageHeader />
      <div className="scrollbar min-h-0 flex-1 overflow-y-auto [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
          {artifacts.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{m.artifacts_empty_title()}</EmptyTitle>
                <EmptyDescription>{m.artifacts_empty_description()}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {artifacts.map((artifact) => (
                <Item key={artifact.id} variant="outline">
                  <ItemMedia variant="icon">{artifact.emoji}</ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="w-full">
                      <ItemLink asChild>
                        <Link
                          params={{ botId: artifact.botId, conversationId: artifact.conversationId, artifactId: artifact.id }}
                          to="/artifacts/$botId/$conversationId/$artifactId"
                        >
                          {artifact.title}
                        </Link>
                      </ItemLink>
                    </ItemTitle>
                    <ItemDescription className="truncate">
                      {m.artifacts_meta({ version: artifact.version, date: hydrated ? dates.format(new Date(artifact.updatedAt)) : '' })}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <ItemValue><IconChevronRight /></ItemValue>
                  </ItemActions>
                </Item>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
