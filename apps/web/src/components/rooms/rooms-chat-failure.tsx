import { m } from '@repo/i18n/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import IconInfo from '~icons/lucide/info';

interface RoomsChatFailureProps {
  botName: string
  detail: string
}

export function RoomsChatFailure({ botName, detail }: RoomsChatFailureProps) {
  return (
    <>
      <span className="text-xs text-muted-foreground">{m.rooms_chat_failed({ bot: botName })}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            aria-label={m.rooms_chat_info()}
            size="icon-xs"
            title={m.rooms_chat_info()}
            variant="quiet"
          >
            <IconInfo className="size-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          arrow={false}
          className="w-64 p-3"
        >
          <div className="flex flex-col gap-1.5 text-xs">
            <p className="font-medium">{m.rooms_chat_failed_detail()}</p>
            <p className="scrollbar max-h-64 overflow-y-auto font-mono text-xxs wrap-break-word whitespace-pre-wrap text-muted-foreground outline-hidden [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1">{detail}</p>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
