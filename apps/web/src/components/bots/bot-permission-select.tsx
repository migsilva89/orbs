import { botFields } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BotPermission } from '@/types/bot.types';

interface BotPermissionSelectProps {
  value: BotPermission
  disabled?: boolean
  onChange: (value: BotPermission) => void
}

export function BotPermissionSelect({ value, disabled, onChange }: BotPermissionSelectProps) {
  const labels = {
    'read-only': m.rooms_bot_permission_read_only(),
    ask: m.rooms_bot_permission_ask(),
    auto: m.rooms_bot_permission_auto(),
    full: m.rooms_bot_permission_full(),
  } satisfies Record<BotPermission, string>;

  const hints = {
    'read-only': m.rooms_bot_permission_read_only_hint(),
    ask: m.rooms_bot_permission_ask_hint(),
    auto: m.rooms_bot_permission_auto_hint(),
    full: m.rooms_bot_permission_full_hint(),
  } satisfies Record<BotPermission, string>;

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
          {botFields.shape.permission.options.map((option) => <SelectItem key={option} value={option}>{labels[option]}</SelectItem>)}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{hints[value]}</p>
    </div>
  );
}
