import { botDefaultSettings } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useReducedMotion } from 'motion/react';
import * as motion from 'motion/react-m';
import { AvatarBlob } from '@/components/avatars/avatar-blob';
import { OnboardingScene } from '@/components/onboarding/onboarding-scene';
import { SettingsProviderLogo } from '@/components/settings/settings-provider-logo';
import { rpc } from '@/services/rpc/rpc.client';
import IconCheck from '~icons/lucide/check';
import IconEllipsis from '~icons/lucide/ellipsis';
import type { Provider } from '@repo/contracts/universal';

const PATHS = [
  'M50 0V14Q50 30 70 30H130Q150 30 150 46V60',
  'M150 0V60',
  'M250 0V14Q250 30 230 30H170Q150 30 150 46V60',
];

const MOTION = {
  tile: { off: { y: 0 }, on: { y: -3, transition: { duration: 0.4 } } },
  ring: { off: { opacity: 0 }, on: { opacity: 1, transition: { duration: 0.25 } } },
  path: { off: { pathLength: 0, opacity: 0 }, on: { pathLength: 1, opacity: 1, transition: { delay: 0.2, duration: 0.75, ease: 'easeInOut' } } },
  placeholder: { off: { opacity: 1 }, on: { opacity: 0, transition: { delay: 0.8, duration: 0.2 } } },
  model: { off: { opacity: 0, y: 3 }, on: { opacity: 1, y: 0, transition: { delay: 0.85, duration: 0.3 } } },
  badge: { off: { opacity: 0, scale: 0.85 }, on: { opacity: 1, scale: 1, transition: { delay: 1.2, duration: 0.3 } } },
} as const;

const TILE = 'relative flex size-13 items-center justify-center rounded-2xl border bg-background shadow-tactile [&_svg]:size-6';

interface OnboardingSceneModelProps {
  connected: Provider[]
  featured: Provider[]
}

export function OnboardingSceneModel({ connected, featured }: OnboardingSceneModelProps) {
  const isReduced = useReducedMotion();
  const { data: models = [] } = useQuery({ ...rpc.models.list.queryOptions(), retry: false });
  const extra = connected.find((provider) => !featured.includes(provider)) ?? null;
  const tiles = [...featured, extra];
  const active = tiles.find((provider) => provider?.isConfigured) ?? null;
  const offered = models.filter((model) => model.provider === active?.id);
  const { modelId } = botDefaultSettings({ models: offered, thinkingLevel: 'medium' });
  const modelName = offered.find((model) => model.id === modelId)?.name ?? active?.name;

  return (
    <OnboardingScene>
      <motion.div
        animate={active ? 'on' : 'off'}
        className="absolute top-1/2 left-1/2 flex w-75 -translate-1/2 flex-col"
        initial={isReduced ? false : 'off'}
        key={active?.id ?? 'none'}
      >
        <div className="grid grid-cols-3 text-center text-xs text-muted-foreground">
          {tiles.map((provider, index) => {
            const isActive = provider !== null && provider === active;

            return (
              <div className="flex flex-col items-center gap-2" key={provider?.id ?? index}>
                <motion.div className={TILE} variants={isActive ? MOTION.tile : undefined}>
                  {provider ? <SettingsProviderLogo providerId={provider.id} /> : <IconEllipsis className="text-muted-foreground" />}
                  {isActive ? <motion.span className="absolute -inset-px rounded-2xl border border-foreground/50" variants={MOTION.ring} /> : null}
                </motion.div>
                <span className="truncate">{provider?.name ?? m.onboarding_scene_model_more()}</span>
              </div>
            );
          })}
        </div>
        <svg
          className="mt-2 h-15 w-75"
          fill="none"
          viewBox="0 0 300 60"
        >
          {PATHS.map((path) => (
            <path
              className="stroke-border"
              d={path}
              key={path}
              strokeWidth="1.25"
            />
          ))}
          {active ? (
            <motion.path
              className="stroke-foreground"
              d={PATHS[tiles.indexOf(active)]}
              strokeLinecap="round"
              strokeWidth="2"
              variants={MOTION.path}
            />
          ) : null}
        </svg>
        <div className="rounded-2xl border bg-background p-4 shadow-floating">
          <div className="flex items-center gap-3">
            <AvatarBlob
              body="pebble"
              color="violet"
              expression={active ? 'happy' : 'curious'}
              size={64}
              state={active ? 'wink' : 'idle'}
            />
            <span className="flex-1 text-sm">{m.onboarding_scene_model_bot()}</span>
            {active ? (
              <motion.span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xxs text-success" variants={MOTION.badge}>
                <IconCheck className="size-3" />
                {m.settings_providers_connected()}
              </motion.span>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-3 border-t pt-3 text-xs">
            <span className="text-muted-foreground">{m.onboarding_scene_model_thinks()}</span>
            <div className="relative ml-auto flex h-5 min-w-28 items-center justify-end">
              <motion.span className="absolute inset-y-1.5 right-0 w-24 rounded-full bg-muted" variants={active ? MOTION.placeholder : undefined} />
              {active ? (
                <motion.span className="relative flex items-center gap-1.5 truncate [&_svg]:size-3.5" variants={MOTION.model}>
                  <SettingsProviderLogo providerId={active.id} />
                  {modelName}
                </motion.span>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
    </OnboardingScene>
  );
}
