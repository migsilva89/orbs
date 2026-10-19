import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { toolSettingsForm } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { SettingsToolsRules } from '@/components/settings/settings-tools-rules';
import { ButtonLoading } from '@/components/ui/button-loading';
import { Form, FormErrors } from '@/components/ui/forms/form';
import { FormInput } from '@/components/ui/forms/form-input';
import { PanelFooter, PanelRow } from '@/components/ui/panel';
import { toasty } from '@/components/ui/sonner';
import { rpc } from '@/services/rpc/rpc.client';
import IconKeyRound from '~icons/lucide/key-round';
import IconListChecks from '~icons/lucide/list-checks';
import IconShieldCheck from '~icons/lucide/shield-check';

export function SettingsTools() {
  const queryClient = useQueryClient();
  const { data: settings } = useSuspenseQuery(rpc.tools.settings.queryOptions());

  const form = useForm({
    resolver: standardSchemaResolver(toolSettingsForm),
    resetOptions: { keepDirtyValues: true },
    values: { approvalRules: settings.approvalRules, jevApiKey: '' },
  });

  const save = useMutation(rpc.tools.configure.mutationOptions({
    onSuccess: (saved) => {
      queryClient.setQueryData(rpc.tools.settings.queryKey(), saved);
      form.reset({ approvalRules: saved.approvalRules, jevApiKey: '' });
      toasty(m.settings_saved(), '✅');
    },
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => save.mutate({ approvalRules: values.approvalRules, jevApiKey: values.jevApiKey || undefined }))}>
        <fieldset className="contents" disabled={save.isPending}>
          <SettingsPanel
            description={m.settings_tools_hint()}
            icon={IconShieldCheck}
            id="tools"
            title={m.settings_tools()}
          >
            <PanelRow className="items-start">
              <IconListChecks />
              <div className="min-w-0 flex-1">
                <SettingsToolsRules disabled={save.isPending} />
              </div>
            </PanelRow>
            <PanelRow className="items-start">
              <IconKeyRound />
              <div className="min-w-0 flex-1">
                <FormInput
                  autoComplete="off"
                  hint={m.settings_tools_jev_hint()}
                  label={m.settings_tools_jev()}
                  name="jevApiKey"
                  placeholder={settings.isJevConfigured ? m.settings_secret_saved() : m.settings_tools_jev_placeholder()}
                  type="password"
                />
              </div>
            </PanelRow>
            <PanelFooter>
              <FormErrors className="mr-auto" error={save.isError ? m.settings_save_error() : null} />
              <ButtonLoading
                disabled={save.isPending}
                loading={save.isPending}
                size="sm"
                type="submit"
              >
                {m.settings_save()}
              </ButtonLoading>
            </PanelFooter>
          </SettingsPanel>
        </fieldset>
      </form>
    </Form>
  );
}
