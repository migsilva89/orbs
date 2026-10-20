import { m } from '@openbots/i18n/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import IconQuote from '~icons/lucide/quote';

interface RoomsChatQuoteProps {
  rect: DOMRect
  onQuote: () => void
  onDismiss: () => void
}

export function RoomsChatQuote({ rect, onQuote, onDismiss }: RoomsChatQuoteProps) {
  return (
    <Popover open onOpenChange={(open) => (open ? undefined : onDismiss())}>
      <PopoverAnchor virtualRef={{ current: { getBoundingClientRect: () => rect } }} />
      <PopoverContent
        align="center"
        arrow={false}
        className="w-auto p-1"
        side={window.matchMedia('(pointer: coarse)').matches ? 'bottom' : 'top'}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Button
          size="xs"
          type="button"
          variant="ghost"
          onClick={onQuote}
          onMouseDown={(event) => event.preventDefault()}
        >
          <IconQuote />
          {m.rooms_chat_quote()}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
