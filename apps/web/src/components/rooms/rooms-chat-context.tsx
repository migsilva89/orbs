import { useChatContextUsage } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { PromptInputButton } from '@repo/ui/ai/prompt-input';
import { Button } from '@repo/ui/button';
import { cn } from '@repo/ui/cn';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { Progress } from '@repo/ui/progress';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import IconFoldVertical from '~icons/lucide/fold-vertical';
import IconRotateCcw from '~icons/lucide/rotate-ccw';
import IconTriangleAlert from '~icons/lucide/triangle-alert';
import type { Bot } from '@repo/contracts/universal';

interface RoomsChatContextProps {
  bot: Bot
  conversationId: number
  latestEntryId: number
  isBusy: boolean
  isCompacting: boolean
}

export function RoomsChatContext({ bot, conversationId, latestEntryId, isBusy, isCompacting }: RoomsChatContextProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const usage = useChatContextUsage({
    botId: bot.id,
    conversationId,
    revision: isBusy ? undefined : latestEntryId,
  });

  if (!usage.context) {
    return null;
  }

  const { percent, shown, used, label, tokens, isNearFull } = usage.context;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <PromptInputButton
          aria-label={label}
          size={percent === null || isNearFull ? 'sm' : 'icon-sm'}
          title={label}
        >
          <span className={cn('flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums', isNearFull && 'text-warning')}>
            {percent === null ? `~${used}` : (
              <>
                <svg
                  aria-hidden
                  className="size-4 -rotate-90"
                  viewBox="0 0 16 16"
                >
                  <circle
                    className="fill-none stroke-current opacity-25"
                    cx="8"
                    cy="8"
                    r="6"
                    strokeWidth="2"
                  />
                  <circle
                    className="fill-none stroke-current"
                    cx="8"
                    cy="8"
                    pathLength={100}
                    r="6"
                    strokeDasharray={`${percent} 100`}
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                </svg>
                {isNearFull ? shown : null}
              </>
            )}
          </span>
        </PromptInputButton>
      </PopoverTrigger>
      <PopoverContent align="end" side="top">
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium">{m.rooms_context_title()}</span>
            {shown ? (
              <span className={cn('flex items-center gap-1 text-muted-foreground tabular-nums', isNearFull && 'text-warning')}>
                {isNearFull ? <IconTriangleAlert aria-hidden className="size-3.5" /> : null}
                {shown}
              </span>
            ) : null}
          </div>
          {percent === null ? null : (
            <Progress
              className="h-1"
              value={percent}
              variant={isNearFull ? 'warning' : 'default'}
            />
          )}
          <p className="text-xs text-muted-foreground tabular-nums">
            {tokens}
          </p>
          <p className="text-xs text-muted-foreground">{m.rooms_context_estimate({ bot: bot.name })}</p>
          <div className="flex gap-2">
            <Button
              disabled={isCompacting || usage.isCompacting}
              size="xs"
              variant={isNearFull ? 'primary' : 'outline'}
              onClick={() => {
                setIsOpen(false);
                usage.compact();
              }}
            >
              <IconFoldVertical aria-hidden />
              {m.rooms_context_compact()}
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                void navigate({ to: '/rooms/direct/$handle/reset', params: { handle: bot.handle } });
              }}
            >
              <IconRotateCcw aria-hidden />
              {m.rooms_context_reset()}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
