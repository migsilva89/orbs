import { m } from '@openbots/i18n/client';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Button } from './button';
import { Input } from './input';
import { Text } from './text';

interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel: string;
  /** Text the user must type before the confirm button is enabled, such as the bot name; empty while it loads keeps the button disabled. */
  confirmText?: string;
  error?: string | null;
  isPending: boolean;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** The body of a routed confirmation dialog, centered over a dimmed screen like the web `ConfirmationDialog`. */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const { title, description, confirmLabel, confirmText, error, isPending, isDestructive = false, onConfirm, onCancel } = props;
  const [typed, setTyped] = useState('');
  const isConfirmed = confirmText === undefined || (confirmText !== '' && typed.trim() === confirmText);

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      <View className="flex-1 items-center justify-center px-8">
        <Pressable
          accessibilityLabel={m.ui_cancel()}
          className="absolute inset-0 bg-black/50"
          disabled={isPending}
          onPress={onCancel}
        />
        <View accessibilityRole="alert" className="w-full max-w-sm gap-4 rounded-3xl bg-card p-5">
          <View className="items-center gap-1.5">
            <Text className="text-center" variant="heading">{title}</Text>
            {description ? <Text className="text-center" tone="muted">{description}</Text> : null}
            {error ? <Text className="text-center" variant="error">{error}</Text> : null}
          </View>
          {confirmText ? (
            <Input
              accessibilityLabel={m.ui_confirm_type_name({ name: confirmText })}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isPending}
              placeholder={m.ui_confirm_type_name({ name: confirmText })}
              value={typed}
              onChangeText={setTyped}
            />
          ) : null}
          <View className="flex-row gap-2">
            <Button
              className="flex-1"
              disabled={isPending}
              variant="ghost"
              onPress={onCancel}
            >
              {m.ui_cancel()}
            </Button>
            <Button
              className="flex-1"
              disabled={!isConfirmed}
              loading={isPending}
              variant={isDestructive ? 'red' : 'primary'}
              onPress={onConfirm}
            >
              {confirmLabel}
            </Button>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
