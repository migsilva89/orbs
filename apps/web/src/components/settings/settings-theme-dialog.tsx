import { m } from '@openbots/i18n/client';
import { generateId } from 'ai';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormErrors } from '@/components/ui/forms/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ThemePreview } from '@/components/ui/theme-preview';
import { useTheme } from '@/hooks/use-theme';
import { themeParseCss } from '@/services/theme/theme.client';
import { THEME_IMPORT_LIMITS } from '@/services/theme/theme.constants';

interface SettingsThemeDialogProps {
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function SettingsThemeDialog({ onOpenChange, onSaved }: SettingsThemeDialogProps) {
  const theme = useTheme();
  const nameId = useId();
  const cssId = useId();
  const errorId = useId();
  const [name, setName] = useState('');
  const [css, setCss] = useState('');
  const [failed, setFailed] = useState(false);
  const parsed = themeParseCss({ css });
  const importError = parsed.error === 'modes' ? m.settings_theme_modes_error() : m.settings_theme_values_error();
  const error = css.trim() && parsed.error ? importError : null;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-4rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{m.settings_theme_add()}</DialogTitle>
          <DialogDescription>{m.settings_theme_import_hint()}</DialogDescription>
        </DialogHeader>
        <form
          className="grid min-w-0 gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (parsed.error || !name.trim()) {
              return;
            }

            const saved = theme.create({
              id: generateId(),
              name: name.trim(),
              light: parsed.light,
              dark: parsed.dark,
            });

            setFailed(!saved);
            if (saved) {
              onSaved();
            }
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor={nameId}>{m.settings_theme_name()}</Label>
            <Input
              required
              id={nameId}
              maxLength={THEME_IMPORT_LIMITS.nameLength}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={cssId}>{m.settings_theme_css()}</Label>
            <Textarea
              required
              aria-describedby={error ? errorId : undefined}
              aria-invalid={Boolean(error)}
              className="max-h-48 min-h-32"
              id={cssId}
              maxLength={THEME_IMPORT_LIMITS.cssLength}
              spellCheck={false}
              value={css}
              onChange={(event) => setCss(event.target.value)}
            />
            <div id={errorId}>
              <FormErrors error={error} />
            </div>
          </div>
          <Tabs defaultValue={theme.resolved}>
            <TabsList aria-label={m.settings_theme_preview()}>
              <TabsTrigger value="light">{m.settings_appearance_light()}</TabsTrigger>
              <TabsTrigger value="dark">{m.settings_appearance_dark()}</TabsTrigger>
            </TabsList>
            {(['light', 'dark'] as const).map((mode) => (
              <TabsContent key={mode} value={mode}>
                <ThemePreview
                  data-theme-preview={mode}
                  message={m.settings_theme_preview_message()}
                  reply={m.settings_theme_preview_reply()}
                  style={parsed.error ? undefined : parsed[mode]}
                  title={m.settings_theme_preview()}
                />
              </TabsContent>
            ))}
          </Tabs>
          <FormErrors error={failed ? m.settings_theme_storage_error() : null} />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{m.settings_theme_cancel()}</Button>
            </DialogClose>
            <Button
              disabled={!name.trim() || Boolean(parsed.error)}
              type="submit"
              variant="default"
            >
              {m.settings_theme_save()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
