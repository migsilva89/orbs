import { generateCACertificate, getLocal } from 'mockttp';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { rootCertificates } from 'node:tls';
import { secretProxyActionScrub } from './secret-proxy-action.scrub';
import { secretProxyActionSwap } from './secret-proxy-action.swap';
import { SECRET_PROXY } from './secret-proxy.constants';
import { secretProxyCarries, secretProxyIsLocal } from './secret-proxy.utils';
import type { SecretProxyServiceDeps } from '../../types/secret-proxy.types';

const refused = { response: { statusCode: 403, body: 'Only this machine may use the secret proxy.\n' } };

/** Starts the proxy once, on the first command that needs it; a failed start is retried by the next command. */
export function secretProxyActionStart(deps: SecretProxyServiceDeps) {
  deps.state.starting ??= secretProxyStart(deps).catch((error: unknown) => {
    deps.state.starting = null;
    throw error;
  });

  return deps.state.starting;
}

async function secretProxyStart(deps: SecretProxyServiceDeps) {
  // A fresh CA each start: its key stays in memory, and only the public bundle is written for child commands.
  const ca = await generateCACertificate();
  const server = getLocal({ https: ca });

  await mkdir(deps.folder, { recursive: true, mode: 0o700 });
  await writeFile(join(deps.folder, SECRET_PROXY.bundleFile), [ca.cert, ...rootCertificates].join('\n'), { mode: 0o644 });

  // Requests carrying a placeholder are buffered to swap and scrub them; all other traffic streams through untouched.
  await server.forAnyRequest().always().matching(secretProxyCarries).thenPassThrough({
    beforeRequest: (request) => (secretProxyIsLocal(request.remoteIpAddress) ? secretProxyActionSwap(deps, { request }) : refused),
    beforeResponse: (response, request) => secretProxyActionScrub(deps, { response, request }),
  });

  await server.forAnyRequest().always().thenPassThrough({
    beforeRequest: (request) => (secretProxyIsLocal(request.remoteIpAddress) ? undefined : refused),
  });

  await server.start();

  deps.state.server = server;
}
