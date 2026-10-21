import { BOT_PERMISSION_HINTS, BOT_PERMISSION_LABELS } from '@openbots/client/client';
import { botFields } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BotPermission } from '@openbots/client/client';

interface BotPermissionSelectProps {
  value: BotPermission
  disabled?: boolean
  onChange: (value: BotPermission) => void
}

export function BotPermissionSelect({ value, disabled, onChange }: BotPermissionSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <Select
        disabled={disabled}
        value={value}
        onValueChange={(next) => onChange(botFields.shape.permission.parse(next))}
      >
        <SelectTrigger aria-label={m.rooms_bot_permission()}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {botFields.shape.permission.options.map((option) => <SelectItem key={option} value={option}>{BOT_PERMISSION_LABELS[option]()}</SelectItem>)}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{BOT_PERMISSION_HINTS[value]()}</p>
    </div>
  );
}
