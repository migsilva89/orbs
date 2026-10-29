import { useTheme } from '@repo/client/web';
import { m } from '@repo/i18n/client';
import { ClientOnly, Link } from '@tanstack/react-router';
import { useId, useState } from 'react';
import IconPlus from '~icons/lucide/plus';
import { Button } from '../button';
import { ButtonGroup } from '../button-group';
import { ColorSwatches } from '../color-swatches';
import { FormErrors } from '../forms/form';
import { Label } from '../label';
import { PanelContent, PanelRow } from '../panel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { Skeleton } from '../skeleton';
import { SettingsGroup } from './settings-group';

function SettingsAppearanceControls() {
  const theme = useTheme();
  const modeId = useId();
  const paletteId = useId();
  const [failed, setFailed] = useState(false);

  return (
    <>
      <PanelRow>
        <PanelContent>
          <Label htmlFor={modeId}>{m.settings_appearance_mode()}</Label>
        </PanelContent>
        <Select
          value={theme.choice}
          onValueChange={(choice) => {
            if (choice === 'system' || choice === 'light' || choice === 'dark') {
              setFailed(!theme.setChoice(choice));
            }
          }}
        >
          <SelectTrigger className="w-40" id={modeId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">{m.settings_appearance_system()}</SelectItem>
            <SelectItem value="light">{m.settings_appearance_light()}</SelectItem>
            <SelectItem value="dark">{m.settings_appearance_dark()}</SelectItem>
          </SelectContent>
        </Select>
      </PanelRow>
      <PanelRow>
        <PanelContent>
          <Label htmlFor={paletteId}>{m.settings_appearance_theme()}</Label>
        </PanelContent>
        <ButtonGroup aria-label={m.settings_appearance_theme()} className="max-w-full">
          <Select value={theme.selected} onValueChange={(id) => setFailed(!theme.select(id))}>
            <SelectTrigger className="w-48 min-w-0" id={paletteId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {theme.themes.map((palette) => (
                <SelectItem
                  key={palette.id}
                  textValue={palette.name}
                  value={palette.id}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <ColorSwatches data-theme-preview={theme.resolved} style={palette[theme.resolved]} />
                    <span className="truncate">{palette.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            asChild
            aria-label={m.settings_theme_add()}
            size="icon"
            title={m.settings_theme_add()}
            variant="outline"
          >
            <Link
              replace
              to="/settings/themes/create"
            >
              <IconPlus className="size-4" />
            </Link>
          </Button>
        </ButtonGroup>
      </PanelRow>
      {failed ? (
        <PanelRow>
          <FormErrors error={m.settings_theme_storage_error()} />
        </PanelRow>
      ) : null}
    </>
  );
}

export function SettingsAppearance() {
  return (
    <SettingsGroup isTitleVisible title={m.settings_appearance()}>
      <ClientOnly
        fallback={(
          <PanelRow>
            <Skeleton className="h-24 w-full" />
          </PanelRow>
        )}
      >
        <SettingsAppearanceControls />
      </ClientOnly>
    </SettingsGroup>
  );
}
