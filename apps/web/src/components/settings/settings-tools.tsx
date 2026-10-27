import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useSettingsTools } from '@repo/client/react';
import { TOOL_APPROVAL, toolSettingsForm } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { ButtonLoading } from '@repo/ui/button-loading';
import { Form, FormErrors } from '@repo/ui/forms/form';
import { FormInput } from '@repo/ui/forms/form-input';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '@repo/ui/panel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { SettingsGroup } from '@repo/ui/settings/settings-group';
import { SettingsToolsRules } from '@repo/ui/settings/settings-tools-rules';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { rpc } from '@/services/rpc/rpc.client';

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
        <fieldset className="flex flex-col gap-4" disabled={save.isPending}>
          <SettingsGroup title={m.settings_tools_rules()}>
            <PanelRow className="items-start">
              <div className="min-w-0 flex-1">
                <SettingsToolsRules disabled={save.isPending} />
              </div>
            </PanelRow>
          </SettingsGroup>
          <SettingsGroup title={m.settings_tools_timeout()}>
            <PanelRow>
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
          </SettingsGroup>
          <SettingsGroup title={m.settings_tools_jev()}>
            <PanelRow className="items-start">
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <h3 className="text-sm font-medium">{m.settings_tools_jev()}</h3>
                <FormInput
                  aria-label={m.settings_tools_jev()}
                  autoComplete="off"
                  name="jevApiKey"
                  placeholder={settings.isJevConfigured ? m.settings_secret_saved() : m.settings_tools_jev_placeholder()}
                  type="password"
                />
              </div>
            </PanelRow>
          </SettingsGroup>
          <div className="flex items-center justify-end gap-2">
            <FormErrors className="mr-auto" error={save.problem} />
            <ButtonLoading
              disabled={save.isPending}
              loading={save.isPending}
              size="sm"
              type="submit"
            >
              {m.settings_save()}
            </ButtonLoading>
          </div>
        </fieldset>
      </form>
    </Form>
  );
}
