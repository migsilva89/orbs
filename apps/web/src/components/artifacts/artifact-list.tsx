import { m } from '@repo/i18n/client';
import { getLocale } from '@repo/i18n/runtime';
import { BotAvatar } from '@repo/ui/bots/bot-avatar';
import { cn } from '@repo/ui/cn';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@repo/ui/empty';
import { SectionDialog, SectionDialogBody, SectionDialogNav, SectionDialogNavItem, SectionDialogNavLabel, SectionDialogNavTitle } from '@repo/ui/section-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/tooltip';
import { useSuspenseQueries, useSuspenseQuery } from '@tanstack/react-query';
import { Link, useHydrated } from '@tanstack/react-router';
import { useState } from 'react';
import { ArtifactPage } from '@/components/artifacts/artifact-page';
import { rpc } from '@/services/rpc/rpc.client';
import IconChevronRight from '~icons/lucide/chevron-right';
import type { ArtifactsRef } from '@repo/ui/artifacts.types';

interface ArtifactListProps {
  selected: ArtifactsRef | undefined
  onClose: () => void
}

export function ArtifactList({ selected, onClose }: ArtifactListProps) {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());

  const groups = useSuspenseQueries({
    queries: bots.map((bot) => rpc.artifacts.listBot.queryOptions({ input: { botId: bot.id } })),
    combine: (results) => bots
      .map((bot, index) => ({ bot, artifacts: [...(results[index]?.data ?? [])].sort((left, right) => right.updatedAt - left.updatedAt) }))
      .filter((group) => group.artifacts.length > 0),
  });

  const [collapsed, setCollapsed] = useState(() => new Set(groups.slice(1).map(({ bot }) => bot.id).filter((botId) => botId !== selected?.botId)));
  const [isExpanded, setIsExpanded] = useState(false);
  const hydrated = useHydrated();
  const dates = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <SectionDialog
      description={m.artifacts_description()}
      isExpanded={isExpanded}
      title={m.artifacts_title()}
      onClose={onClose}
    >
      <SectionDialogNav
        activeKey={selected?.artifactId ?? ''}
        header={<SectionDialogNavTitle>{m.artifacts_title()}</SectionDialogNavTitle>}
        label={m.artifacts_title()}
      >
        {groups.flatMap(({ bot, artifacts }) => [
          <SectionDialogNavLabel key={bot.id}>
            <button
              aria-expanded={!collapsed.has(bot.id)}
              className="-mx-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1 py-0.5 text-left transition-colors outline-none hover:text-foreground focus-visible:bg-muted/70"
              type="button"
              onClick={() => setCollapsed((current) => {
                const next = new Set(current);

                if (!next.delete(bot.id)) {
                  next.add(bot.id);
                }

                return next;
              })}
            >
              <BotAvatar
                animate={false}
                bot={bot}
                size={16}
              />
              <span className="truncate">{bot.name}</span>
              <IconChevronRight className={cn('ml-auto size-3.5 shrink-0 transition-transform', !collapsed.has(bot.id) && 'rotate-90')} />
            </button>
          </SectionDialogNavLabel>,
          ...(collapsed.has(bot.id) ? [] : artifacts).map((artifact) => (
            <Tooltip key={artifact.id}>
              <SectionDialogNavItem isActive={artifact.id === selected?.artifactId}>
                <TooltipTrigger asChild>
                  <Link
                    replace
                    params={{ botId: artifact.botId, conversationId: artifact.conversationId, artifactId: artifact.id }}
                    resetScroll={false}
                    to="/artifacts/$botId/$conversationId/$artifactId"
                  >
                    <span className="flex min-w-0 flex-col @min-[720px]/section-dialog:py-1.5">
                      <span className="truncate">{`${artifact.emoji} ${artifact.title}`}</span>
                      <span className="hidden truncate text-xs text-muted-foreground @min-[720px]/section-dialog:block">
                        {m.artifacts_meta({ version: artifact.version, date: hydrated ? dates.format(new Date(artifact.updatedAt)) : '' })}
                      </span>
                    </span>
                  </Link>
                </TooltipTrigger>
              </SectionDialogNavItem>
              <TooltipContent className="flex flex-col" side="right">
                <span className="font-medium">{`${artifact.emoji} ${artifact.title}`}</span>
                <span>{m.artifacts_meta({ version: artifact.version, date: hydrated ? dates.format(new Date(artifact.updatedAt)) : '' })}</span>
              </TooltipContent>
            </Tooltip>
          )),
        ])}
      </SectionDialogNav>
      {selected ? (
        <ArtifactPage
          {...selected}
          isExpanded={isExpanded}
          onExpandedChange={setIsExpanded}
        />
      ) : (
        <SectionDialogBody>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{m.artifacts_empty_title()}</EmptyTitle>
              <EmptyDescription>{m.artifacts_empty_description()}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </SectionDialogBody>
      )}
    </SectionDialog>
  );
}
