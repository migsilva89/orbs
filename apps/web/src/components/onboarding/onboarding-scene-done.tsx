import { BOT_PERMISSION_LABELS, botModelBrand } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { AvatarBlob } from '@repo/ui/avatars/avatar-blob';
import { BotAvatar } from '@repo/ui/bots/bot-avatar';
import { BotBrandLogo } from '@repo/ui/bots/bot-brand-logo';
import { OnboardingScene } from '@repo/ui/onboarding/onboarding-scene';
import { useQuery } from '@tanstack/react-query';
import { useReducedMotion } from 'motion/react';
import * as motion from 'motion/react-m';
import { rpc } from '@/services/rpc/rpc.client';
import IconCheck from '~icons/lucide/check';
import IconCpu from '~icons/lucide/cpu';
import IconLaptop from '~icons/lucide/laptop';
import IconShieldCheck from '~icons/lucide/shield-check';
import type { Bot } from '@repo/contracts/universal';
import type { ReactNode } from 'react';

const MOTION = {
  card: { off: { opacity: 0, y: 18 }, on: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } },
  value: { off: { opacity: 0, x: -4 }, on: { opacity: 1, x: 0 } },
  check: { off: { opacity: 0, scale: 0.4 }, on: { opacity: 1, scale: 1 } },
  ready: { off: { opacity: 0, scale: 0.7, rotate: -8 }, on: { opacity: 1, scale: 1, rotate: 0, transition: { delay: 1.45, type: 'spring', stiffness: 420, damping: 18 } } },
} as const;

const ROW_DELAYS = [0.55, 0.8, 1.05];

interface OnboardingSceneDoneProps {
  bot?: Bot
}

export function OnboardingSceneDone({ bot }: OnboardingSceneDoneProps) {
  const isReduced = useReducedMotion();
  const { data: models = [] } = useQuery({ ...rpc.models.list.queryOptions(), retry: false });
  const model = bot ? models.find((item) => item.provider === bot.modelProvider && item.id === bot.modelId) : undefined;

  const rows: { icon: ReactNode, label: string, value: ReactNode }[] = bot
    ? [
      {
        icon: <IconCpu />,
        label: m.onboarding_scene_done_model(),
        value: (
          <>
            <BotBrandLogo brand={botModelBrand({ providerId: bot.modelProvider, modelId: bot.modelId })} className="size-3.5" />
            {model?.name ?? bot.modelId}
          </>
        ),
      },
      { icon: <IconShieldCheck />, label: m.onboarding_scene_done_permission(), value: BOT_PERMISSION_LABELS[bot.permission]() },
      { icon: <IconLaptop />, label: m.onboarding_scene_done_host(), value: m.onboarding_scene_done_host_value() },
    ]
    : [];

  return (
    <OnboardingScene screenshot="done">
      <motion.div
        animate="on"
        className="absolute bottom-10 left-1/2 w-75 -translate-x-1/2 rounded-2xl border bg-background p-4 shadow-floating"
        initial={isReduced ? false : 'off'}
        variants={MOTION.card}
      >
        <div className="flex items-center gap-3">
          {bot ? (
            <BotAvatar
              animate
              bot={bot}
              cheer={false}
              size={52}
            />
          ) : (
            <AvatarBlob
              body="pebble"
              color="violet"
              expression="happy"
              size={52}
              state="wink"
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm">{bot?.name ?? m.onboarding_scene_model_bot()}</span>
            {bot ? <span className="truncate text-xs text-muted-foreground">@{bot.handle}</span> : null}
          </div>
          <motion.span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xxs text-success" variants={MOTION.ready}>
            <IconCheck className="size-3" />
            {m.onboarding_scene_done_ready()}
          </motion.span>
        </div>
        {rows.length > 0 ? (
          <ul className="m-0 mt-3 flex list-none flex-col gap-2.5 border-t p-0 pt-3 text-xs">
            {rows.map((row, index) => (
              <li className="flex items-center gap-2" key={row.label}>
                <span className="text-muted-foreground [&_svg]:size-3.5">{row.icon}</span>
                <span className="text-muted-foreground">{row.label}</span>
                <motion.span
                  className="ml-auto flex min-w-0 items-center gap-1.5 truncate"
                  transition={{ delay: ROW_DELAYS[index], duration: 0.25 }}
                  variants={MOTION.value}
                >
                  {row.value}
                </motion.span>
                <motion.span
                  className="flex size-4 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground"
                  transition={{ delay: ROW_DELAYS[index] + 0.1, type: 'spring', stiffness: 500, damping: 20 }}
                  variants={MOTION.check}
                >
                  <IconCheck className="size-2.5" />
                </motion.span>
              </li>
            ))}
          </ul>
        ) : null}
      </motion.div>
    </OnboardingScene>
  );
}
