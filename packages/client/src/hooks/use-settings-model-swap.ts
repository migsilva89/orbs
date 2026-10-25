import { m } from '@repo/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { useRpc } from './use-rpc';
import type { SettingsDoneParams } from '../types/settings.types';

export function useSettingsModelSwap({ onDone }: SettingsDoneParams) {
  const { rpc } = useRpc();

  const swap = useMutation(rpc.bots.swapModels.mutationOptions({
    meta: { invalidates: [rpc.bots.list.key()] },
    onSuccess: (result) => onDone(m.settings_models_saved({ primary: result.primary, fallbacks: result.fallbacks })),
  }));

  return {
    isPending: swap.isPending,
    problem: swap.isError ? m.settings_models_save_error() : null,
    swap: swap.mutate,
  };
}
