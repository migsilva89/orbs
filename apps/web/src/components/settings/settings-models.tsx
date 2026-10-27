import { botModelBrand, botModelUsage } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { BotBrandLogo } from '@repo/ui/bots/bot-brand-logo';
import { Button } from '@repo/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu';
import { Empty, EmptyDescription } from '@repo/ui/empty';
import { FormErrors } from '@repo/ui/forms/form';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '@repo/ui/panel';
import { SettingsGroup } from '@repo/ui/settings/settings-group';
import { Skeleton } from '@repo/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { rpc } from '@/services/rpc/rpc.client';
import IconEllipsisVertical from '~icons/lucide/ellipsis-vertical';
import IconReplace from '~icons/lucide/replace';

export function SettingsModels() {
  const bots = useQuery(rpc.bots.list.queryOptions());
  const catalog = useQuery({ ...rpc.models.list.queryOptions(), retry: false });
  const providers = useQuery({ ...rpc.providers.list.queryOptions(), retry: false });
  const models = botModelUsage({ bots: bots.data ?? [] });

  return (
    <SettingsGroup isTitleVisible title={m.settings_models_in_use()}>
      {bots.isPending ? <PanelRow><Skeleton className="h-10 w-full" /></PanelRow> : null}
      {bots.isError ? <PanelRow><FormErrors error={m.settings_models_load_error()} /></PanelRow> : null}
      {bots.isSuccess && models.size === 0 ? <Empty size="sm"><EmptyDescription>{m.settings_models_empty()}</EmptyDescription></Empty> : null}
      {[...models].map(([key, usage]) => {
        const provider = providers.data?.providers.find((item) => item.id === usage.model.modelProvider);
        const model = catalog.data?.find((item) => item.provider === usage.model.modelProvider && item.id === usage.model.modelId);

        return (
          <PanelRow key={key}>
            <BotBrandLogo brand={botModelBrand({ providerId: usage.model.modelProvider, modelId: usage.model.modelId })} />
            <PanelContent>
              <PanelTitle className="truncate">{model?.name ?? usage.model.modelId}</PanelTitle>
              <PanelDescription>{provider?.name ?? usage.model.modelProvider}</PanelDescription>
              <PanelDescription>{m.settings_models_usage({ primary: usage.primary.length, fallbacks: usage.fallbacks.length })}</PanelDescription>
            </PanelContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={m.settings_models_actions({ model: model?.name ?? usage.model.modelId })}
                  size="icon-sm"
                  title={m.settings_models_actions({ model: model?.name ?? usage.model.modelId })}
                  type="button"
                  variant="ghost"
                >
                  <IconEllipsisVertical className="opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    replace
                    params={{ model: key }}
                    to="/settings/models/$model"
                  >
                    <IconReplace />
                    {m.settings_models_replace()}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PanelRow>
        );
      })}
    </SettingsGroup>
  );
}
