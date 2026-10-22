import { m } from '@repo/i18n/client';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ScopedVariables, useCSSVariable } from 'uniwind';
import { FormInput } from '@/components/ui/form-input';
import { Text } from '@/components/ui/text';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/cn';
import { appearanceParseCss, appearanceVariables } from '@/services/appearance/appearance.client';
import { APPEARANCE_IMPORT_LIMITS } from '@/services/appearance/appearance.constants';
import type { AppearanceTokens } from '@/types/appearance.types';

const SETTINGS_THEME_SWATCHES = ['bg-background', 'bg-foreground', 'bg-primary', 'bg-secondary', 'bg-accent', 'bg-border'];

export function SettingsThemeCreateScreen() {
  const router = useRouter();
  const appearance = useAppearance();
  const [primary, primaryForeground] = useCSSVariable(['--color-primary', '--color-primary-foreground']).map(String);
  const [name, setName] = useState('');
  const [css, setCss] = useState('');
  const [failed, setFailed] = useState(false);
  const parsed = appearanceParseCss({ css });
  const importError = parsed.error === 'modes' ? m.settings_theme_modes_error() : m.settings_theme_values_error();

  const save = () => {
    if (parsed.error || !name.trim()) {
      return;
    }

    const saved = appearance.create({
      id: `custom-${Date.now().toString(36)}`,
      name: name.trim(),
      light: parsed.light,
      dark: parsed.dark,
    });

    setFailed(!saved);

    if (saved) {
      router.back();
    }
  };

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          disabled={!name.trim() || Boolean(parsed.error)}
          style={{ color: primaryForeground }}
          tintColor={primary}
          variant="done"
          onPress={save}
        >
          {m.settings_theme_save()}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <View className="flex-1 bg-background">
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerClassName="gap-6 px-4 pt-4 pb-12"
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <Text tone="muted" variant="small">{m.settings_theme_import_hint()}</Text>
          <FormInput
            required
            label={m.settings_theme_name()}
            maxLength={APPEARANCE_IMPORT_LIMITS.nameLength}
            value={name}
            onChangeText={setName}
          />
          <FormInput
            multiline
            required
            autoCapitalize="none"
            autoCorrect={false}
            error={css.trim() && parsed.error ? importError : null}
            label={m.settings_theme_css()}
            maxLength={APPEARANCE_IMPORT_LIMITS.cssLength}
            value={css}
            onChangeText={setCss}
          />
          {parsed.error ? null : (
            <View className="gap-3">
              <Text variant="label">{m.settings_theme_preview()}</Text>
              <SettingsThemeCreateScreenSwatches label={m.settings_appearance_light()} tokens={parsed.light} />
              <SettingsThemeCreateScreenSwatches label={m.settings_appearance_dark()} tokens={parsed.dark} />
            </View>
          )}
          {failed ? <Text tone="destructive" variant="small">{m.mobile_theme_storage_error()}</Text> : null}
        </ScrollView>
      </View>
    </>
  );
}

interface SettingsThemeCreateScreenSwatchesProps {
  label: string;
  tokens: AppearanceTokens;
}

function SettingsThemeCreateScreenSwatches({ label, tokens }: SettingsThemeCreateScreenSwatchesProps) {
  return (
    <ScopedVariables variables={appearanceVariables({ tokens })}>
      <View className="flex-row items-center gap-3">
        <Text
          className="w-12"
          tone="muted"
          variant="small"
        >{label}</Text>
        {SETTINGS_THEME_SWATCHES.map((swatch) => <View className={cn('size-6 rounded-full border border-border', swatch)} key={swatch} />)}
      </View>
    </ScopedVariables>
  );
}
