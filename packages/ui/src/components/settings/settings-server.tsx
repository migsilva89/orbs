import { useSettingsServer } from '@repo/client/react';
import { serverOrigin } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useState } from 'react';
import { match } from 'ts-pattern';
import IconServer from '~icons/lucide/server';
import IconTrash2 from '~icons/lucide/trash-2';
import { Button } from '../button';
import { FormErrors } from '../forms/form';
import { Input } from '../input';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '../item';
import { PanelDescription, PanelRow } from '../panel';
import { SettingsPanel } from './settings-panel';
import type { ServerAddressKind } from '@repo/contracts/universal';

export function SettingsServer() {
  const settings = useSettingsServer();
  const [draft, setDraft] = useState('');
  const parsed = serverOrigin.safeParse(draft.trim());
  const isValid = parsed.success && !settings.addresses.some((address) => address.url === parsed.data);

  const kindLabel = (kind: ServerAddressKind) => match(kind)
    .with('loopback', () => m.settings_server_kind_loopback())
    .with('lan', () => m.settings_server_kind_lan())
    .with('tailscale', () => m.settings_server_kind_tailscale())
    .with('custom', () => m.settings_server_kind_custom())
    .exhaustive();

  function add() {
    if (!parsed.success) {
      return;
    }

    settings.add(parsed.data);
    setDraft('');
  }

  return (
    <SettingsPanel
      icon={IconServer}
      id="server"
      title={m.settings_server()}
    >
      <PanelRow className="items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <PanelDescription>{m.settings_server_description()}</PanelDescription>
          <ItemGroup variant="outline">
            {settings.addresses.map((address) => (
              <Item key={address.url} size="sm">
                <ItemContent className="min-w-0">
                  <ItemTitle className="w-full"><span className="truncate font-mono" title={address.url}>{address.url}</span></ItemTitle>
                  <ItemDescription>{kindLabel(address.kind)}</ItemDescription>
                </ItemContent>
                {address.kind === 'custom' ? (
                  <ItemActions>
                    <Button
                      aria-label={m.settings_server_remove()}
                      disabled={settings.isSaving}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                      onClick={() => settings.remove(address.url)}
                    >
                      <IconTrash2 className="size-4" />
                    </Button>
                  </ItemActions>
                ) : null}
              </Item>
            ))}
          </ItemGroup>
          <div className="flex items-center gap-2">
            <Input
              aria-label={m.settings_server_add()}
              disabled={settings.isSaving}
              placeholder={m.settings_server_add_placeholder()}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button
              disabled={settings.isSaving || !isValid}
              type="button"
              variant="outline"
              onClick={add}
            >
              {m.settings_server_add()}
            </Button>
          </div>
          <FormErrors error={settings.problem ?? undefined} />
        </div>
      </PanelRow>
    </SettingsPanel>
  );
}
