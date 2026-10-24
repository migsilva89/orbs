import { m } from '@repo/i18n/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRpc } from './use-rpc';

/** The daemon's addresses, and the custom ones the owner adds or removes. */
export function useSettingsServer() {
  const { rpc } = useRpc();
  const info = useQuery(rpc.server.info.queryOptions());
  const configure = useMutation(rpc.server.configure.mutationOptions({ meta: { invalidates: [rpc.server.info.key()] } }));
  const addresses = info.data?.addresses ?? [];
  const customAddresses = addresses.filter((address) => address.kind === 'custom').map((address) => address.url);

  return {
    info,
    addresses,
    isSaving: configure.isPending,
    problem: configure.isError ? m.settings_server_error() : null,
    add: (url: string) => configure.mutate({ customAddresses: [...customAddresses, url] }),
    remove: (url: string) => configure.mutate({ customAddresses: customAddresses.filter((custom) => custom !== url) }),
  };
}
