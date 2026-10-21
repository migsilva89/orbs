import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useSettingsTools } from '@openbots/client/react';
import { TOOL_APPROVAL, toolSettingsForm } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { SettingsToolsRules } from '@/components/settings/settings-tools-rules';
import { ButtonLoading } from '@/components/ui/button-loading';
import { Form, FormErrors } from '@/components/ui/forms/form';
import { FormInput } from '@/components/ui/forms/form-input';
import { PanelContent, PanelDescription, PanelFooter, PanelRow, PanelTitle } from '@/components/ui/panel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { rpc } from '@/services/rpc/rpc.client';
import IconKeyRound from '~icons/lucide/key-round';
import IconListChecks from '~icons/lucide/list-checks';
import IconShieldCheck from '~icons/lucide/shield-check';
import IconTimer from '~icons/lucide/timer';

export function SettingsTools() {
  const { data: settings } = useSuspenseQuery(rpc.tools.settings.queryOptions());

  const form = useForm({
    resolver: standardSchemaResolver(toolSettingsForm),
    resetOptions: { keepDirtyValues: true },
    values: {
      approvalRules: settings.approvalRules,
      approvalTimeoutMinutes: settings.approvalTimeoutMinutes,
      jevApiKey: '',
    },
  });

  const save = useSettingsTools({ onDone: () => form.reset({ ...form.getValues(), jevApiKey: '' }) });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(save.save)}>
        <fieldset className="contents" disabled={save.isPending}>
          <SettingsPanel
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
            <PanelRow>
              <IconTimer />
              <PanelContent>
                <PanelTitle>{m.settings_tools_timeout()}</PanelTitle>
                <PanelDescription>{m.settings_tools_timeout_hint()}</PanelDescription>
              </PanelContent>
              <Controller
                control={form.control}
                name="approvalTimeoutMinutes"
                render={({ field }) => (
                  <Select
                    disabled={save.isPending}
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger aria-label={m.settings_tools_timeout()} className="w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOOL_APPROVAL.timeoutMinutes.map((minutes) => (
                        <SelectItem key={minutes} value={String(minutes)}>{m.settings_tools_timeout_minutes({ count: minutes })}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </PanelRow>
            <PanelRow className="items-start">
              <IconKeyRound />
              <div className="min-w-0 flex-1">
                <FormInput
                  autoComplete="off"
                  label={m.settings_tools_jev()}
                  name="jevApiKey"
                  placeholder={settings.isJevConfigured ? m.settings_secret_saved() : m.settings_tools_jev_placeholder()}
                  type="password"
                />
              </div>
            </PanelRow>
            <PanelFooter>
              <FormErrors className="mr-auto" error={save.problem} />
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
