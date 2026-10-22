import { EXPRESSIONS } from '@repo/avatar-blobs/expressions';
import { BODIES, COLORS } from '@repo/avatar-blobs/skins';
import { AVATAR_BODY_LABELS, AVATAR_COLOR_LABELS, AVATAR_EXPRESSION_LABELS, BOT } from '@repo/client/client';
import { useBotAvatarUpload } from '@repo/client/react';
import { AVATAR } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useRef } from 'react';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { Button } from '@/components/ui/button';
import { useBotAvatarFlash } from '@/hooks/use-bot-avatar-flash';
import IconChevronLeft from '~icons/lucide/chevron-left';
import IconChevronRight from '~icons/lucide/chevron-right';
import IconImageUp from '~icons/lucide/image-up';
import type { BotAvatar as BotAvatarValue } from '@repo/client/client';
import type { MouseEvent } from 'react';

const revealOnHover = 'opacity-0 group-focus-within/avatar:opacity-100 group-hover/avatar:opacity-100 pointer-coarse:opacity-100';

interface BotAvatarPickerProps {
  name: string
  value: BotAvatarValue
  onChange: (avatar: BotAvatarValue) => void
  disabled?: boolean
}

export function BotAvatarPicker({ name, value, onChange, disabled = false }: BotAvatarPickerProps) {
  function cycle<T extends { id: string }>(items: readonly T[], currentId: string, step: number): T {
    const index = items.findIndex((item) => item.id === currentId);

    return items[(index + step + items.length) % items.length] ?? items[0];
  }

  const blob = value?.kind === 'blob' ? value : BOT.defaultAvatar;
  const { moving, label, flash } = useBotAvatarFlash();
  const upload = useBotAvatarUpload();
  const fileInput = useRef<HTMLInputElement>(null);

  function shiftBody(step: number) {
    const body = cycle(BODIES, blob.body, step);

    flash(AVATAR_BODY_LABELS[body.id](), () => onChange({ ...blob, body: body.id }));
  }

  function shiftMood(event: MouseEvent) {
    const expression = cycle(EXPRESSIONS, blob.expression, event.shiftKey ? -1 : 1);

    flash(AVATAR_EXPRESSION_LABELS[expression.id](), () => onChange({ ...blob, expression: expression.id }));
  }

  return (
    <div className="group/avatar -mt-4 flex flex-col items-center">
      <div className="flex items-center gap-2">
        <Button
          aria-label={m.avatars_body_previous()}
          className={revealOnHover}
          disabled={disabled}
          size="icon-sm"
          type="button"
          variant="ghost"
          onClick={() => shiftBody(-1)}
        >
          <IconChevronLeft />
        </Button>
        <button
          aria-label={m.avatars_mood_next()}
          className="shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          disabled={disabled}
          title={m.avatars_mood_next()}
          type="button"
          onClick={shiftMood}
        >
          <BotAvatar
            animate={moving}
            bot={{ name, avatar: value }}
            cheer={false}
            size={144}
          />
        </button>
        <Button
          aria-label={m.avatars_body_next()}
          className={revealOnHover}
          disabled={disabled}
          size="icon-sm"
          type="button"
          variant="ghost"
          onClick={() => shiftBody(1)}
        >
          <IconChevronRight />
        </Button>
      </div>
      <output aria-live="polite" className="sr-only">{label}</output>
      <fieldset
        aria-label={m.avatars_color()}
        className="-mt-2 flex justify-center"
        disabled={disabled}
      >
        {COLORS.map(({ id, hex }) => (
          <button
            aria-label={AVATAR_COLOR_LABELS[id]()}
            aria-pressed={value?.kind !== 'image' && blob.color === id}
            className="relative -ml-1 size-5 rounded-full ring-2 ring-background transition-transform outline-none first:ml-0 hover:z-10 hover:scale-125 focus-visible:z-10 focus-visible:ring-ring aria-pressed:z-10 aria-pressed:scale-125 aria-pressed:shadow-sm"
            key={id}
            style={{ backgroundColor: hex }}
            title={AVATAR_COLOR_LABELS[id]()}
            type="button"
            onClick={() => flash(AVATAR_COLOR_LABELS[id](), () => onChange({ ...blob, color: id }))}
          />
        ))}
      </fieldset>
      <Button
        className="mt-3"
        disabled={disabled || upload.isPending}
        size="sm"
        type="button"
        variant="ghost"
        onClick={() => fileInput.current?.click()}
      >
        <IconImageUp />
        {m.avatars_upload()}
      </Button>
      <input
        hidden
        accept={AVATAR.mediaTypes.join(',')}
        ref={fileInput}
        type="file"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';

          if (file) {
            upload.mutate({ file }, { onSuccess: onChange });
          }
        }}
      />
    </div>
  );
}
