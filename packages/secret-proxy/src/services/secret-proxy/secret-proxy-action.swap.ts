import { secretProxyAllows, secretProxyMapHeaders, secretProxyPlaceholder } from './secret-proxy.utils';
import type { SecretProxyServiceDeps, SecretProxySwapParams } from '../../types/secret-proxy.types';
import type { requestSteps } from 'mockttp';

/** Puts real values in place of placeholders in headers and the query string, only over HTTPS to the hosts each secret allows. */
export async function secretProxyActionSwap(
  { source, state }: SecretProxyServiceDeps,
  { request }: SecretProxySwapParams,
): Promise<requestSteps.CallbackRequestResult | undefined> {
  const url = new URL(request.url);
  const carried = JSON.stringify([request.url, request.headers]);
  const rules = (await source.queries.rules()).filter((rule) => carried.includes(secretProxyPlaceholder(rule.name)));
  const refused = rules.find((rule) => url.protocol !== 'https:' || !secretProxyAllows(rule, url.hostname));

  if (refused) {
    return { response: { statusCode: 403, body: `${refused.name} may only be sent over HTTPS to ${refused.hosts.join(', ')}.\n` } };
  }

  const swaps = await Promise.all(rules.map(async ({ name }) => ({
    name,
    placeholder: secretProxyPlaceholder(name),
    value: await source.queries.value({ name }),
  })));

  const missing = swaps.find((swap) => swap.value === null);

  if (missing) {
    return { response: { statusCode: 403, body: `${missing.name} is not stored.\n` } };
  }

  const stored = swaps.flatMap(({ placeholder, value }) => (value === null ? [] : [{ placeholder, value }]));
  const swap = (text: string) => stored.reduce((result, { placeholder, value }) => result.replaceAll(placeholder, value), text);

  state.swapped.set(request.id, stored);
  // Headers and the query string only: a value swapped into the path could be echoed back transformed.
  url.search = swap(url.search);

  return {
    url: url.toString(),
    headers: secretProxyMapHeaders(request.headers, swap),
  };
}
