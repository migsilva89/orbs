import { m } from '@openbots/i18n/client';
import { View } from 'react-native';
import { ActionSheet } from './action-sheet';
import { Button } from './button';
import { Text } from './text';

interface ConfirmSheetProps {
  title: string;
  description?: string;
  confirmLabel: string;
  error?: string | null;
  isPending: boolean;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** The body of a routed confirmation sheet, the native counterpart of the web `ConfirmationDialog`. */
export function ConfirmSheet({ title, description, confirmLabel, error, isPending, isDestructive = false, onConfirm, onCancel }: ConfirmSheetProps) {
  return (
    <ActionSheet>
      <View className="gap-1.5 px-1 pb-2">
        <Text variant="heading">{title}</Text>
        {description ? <Text tone="muted">{description}</Text> : null}
        {error ? <Text variant="error">{error}</Text> : null}
      </View>
      <Button loading={isPending} variant={isDestructive ? 'red' : 'primary'} onPress={onConfirm}>
        {confirmLabel}
      </Button>
      <Button disabled={isPending} variant="secondary" onPress={onCancel}>
        {m.ui_cancel()}
      </Button>
    </ActionSheet>
  );
}
