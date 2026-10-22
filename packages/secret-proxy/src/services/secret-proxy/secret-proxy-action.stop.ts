import type { SecretProxyServiceDeps } from '../../types/secret-proxy.types';

export async function secretProxyActionStop({ state }: SecretProxyServiceDeps) {
  await state.server?.stop();
  state.server = null;
  state.starting = null;
  state.swapped.clear();
}
