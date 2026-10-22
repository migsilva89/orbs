import { SECRET_PROXY } from './secret-proxy.constants';
import { secretProxyMapHeaders } from './secret-proxy.utils';
import type { SecretProxyScrubParams, SecretProxyServiceDeps } from '../../types/secret-proxy.types';
import type { requestSteps } from 'mockttp';

/** Puts placeholders back wherever a swapped value comes back in the response, so the command never reads it. */
export async function secretProxyActionScrub(
  { state }: SecretProxyServiceDeps,
  { response, request }: SecretProxyScrubParams,
): Promise<requestSteps.CallbackResponseResult | undefined> {
  const swaps = state.swapped.get(request.id) ?? [];
  state.swapped.delete(request.id);

  const scrub = (text: string) => swaps.reduce((result, { placeholder, value }) => result.replaceAll(value, placeholder), text);
  const body = response.body.buffer.byteLength > SECRET_PROXY.scrubMaxBytes ? undefined : await response.body.getText();
  const scrubbed = body === undefined ? undefined : scrub(body);

  return {
    headers: secretProxyMapHeaders(response.headers, scrub),
    // Only a changed body is replaced, so binary responses pass through byte for byte.
    body: scrubbed === body ? undefined : scrubbed,
  };
}
