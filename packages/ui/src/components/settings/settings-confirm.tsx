import { m } from '@repo/i18n/client';
import { useState } from 'react';
import { Button } from '../button';
import { ButtonLoading } from '../button-loading';
import { FormErrors } from '../forms/form';
import { Input } from '../input';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '../panel';

interface SettingsConfirmProps {
  title?: string
  description?: string
  confirmLabel: string
  confirmText?: string
  pending: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function SettingsConfirm({ title, description, confirmLabel, confirmText, pending, error, onConfirm, onCancel }: SettingsConfirmProps) {
  const [typed, setTyped] = useState('');
  const isConfirmed = confirmText === undefined || typed.trim() === confirmText;

  return (
    <PanelRow className="flex-col items-stretch" role="alert">
      {title ? (
        <PanelContent>
          <PanelTitle>{title}</PanelTitle>
          {description ? <PanelDescription>{description}</PanelDescription> : null}
        </PanelContent>
      ) : null}
      {confirmText ? (
        <Input
          aria-label={m.ui_confirm_type_name({ name: confirmText })}
          autoComplete="off"
          disabled={pending}
          placeholder={m.ui_confirm_type_name({ name: confirmText })}
          spellCheck={false}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
        />
      ) : null}
      <FormErrors error={error} />
      <div className="flex justify-end gap-2">
        <Button
          disabled={pending}
          size="sm"
          variant="outline"
          onClick={onCancel}
        >
          {m.ui_cancel()}
        </Button>
        <ButtonLoading
          disabled={!isConfirmed}
          loading={pending}
          size="sm"
          variant="destructive"
          onClick={onConfirm}
        >
          {confirmLabel}
        </ButtonLoading>
      </div>
    </PanelRow>
  );
}
