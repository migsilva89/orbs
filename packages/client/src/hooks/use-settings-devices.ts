import { m } from '@openbots/i18n/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRpc } from './use-rpc';

/** Paired devices and a fresh pairing code for adding another one. */
export function useSettingsDevices() {
  const { rpc } = useRpc();
  const devices = useQuery(rpc.devices.list.queryOptions());
  const pair = useMutation(rpc.pairing.create.mutationOptions());

  return {
    devices,
    pairing: pair.data ?? null,
    isPairing: pair.isPending,
    pairProblem: pair.isError ? m.settings_devices_pair_error() : null,
    pair: (serverUrl: string) => pair.mutate({ serverUrl }),
  };
}
