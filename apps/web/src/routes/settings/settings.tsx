import { settingsSection } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { createFileRoute, useMatch, useParams } from '@tanstack/react-router';
import { match, P } from 'ts-pattern';
import { SettingsDialog } from '@/components/settings/settings-dialog';
import { useSectionDialogClose } from '@/hooks/use-section-dialog-close';
import { rpc } from '@/services/rpc/rpc.client';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/_chat/settings')({
  head: () => seoHead({ title: m.settings_title() }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(rpc.providers.list.queryOptions()),
      context.queryClient.ensureQueryData(rpc.tools.settings.queryOptions()),
      context.queryClient.ensureQueryData(rpc.conversation.settings.queryOptions()),
      context.queryClient.ensureQueryData(rpc.skills.settings.queryOptions()),
      context.queryClient.ensureQueryData(rpc.instructions.settings.queryOptions()),
      context.queryClient.ensureQueryData(rpc.plugins.settings.queryOptions()),
      context.queryClient.ensureQueryData(rpc.mcp.settings.queryOptions()),
      context.queryClient.ensureQueryData(rpc.devices.list.queryOptions()),
    ]);

    return { breadcrumb: m.settings_title(), connection: context.connection };
  },
  component: SettingsRoute,
});

function SettingsRoute() {
  const { connection } = Route.useLoaderData();
  const { tab, model, deviceId, providerId } = useParams({ strict: false });
  const theme = useMatch({ from: '/_chat/settings/themes/create', shouldThrow: false });
  const close = useSectionDialogClose();

  const state = match({
    theme,
    model,
    deviceId,
    providerId,
    tab: settingsSection.safeParse(tab),
  })
    .with({ theme: P.nonNullable }, () => ({ section: 'general' as const, view: 'theme' as const }))
    .with({ model: P.string }, () => ({ section: 'models' as const, view: 'swap' as const }))
    .with({ deviceId: P.string }, () => ({ section: 'devices' as const, view: undefined }))
    .with({ providerId: P.string }, () => ({ section: 'models' as const, view: undefined }))
    .with({ tab: { success: true } }, ({ tab: parsed }) => ({ section: parsed.data, view: undefined }))
    .otherwise(() => null);

  if (!state) {
    return null;
  }

  return (
    <SettingsDialog
      connection={connection}
      deviceId={deviceId}
      modelKey={model}
      providerId={providerId}
      section={state.section}
      view={state.view}
      onClose={close}
    />
  );
}
