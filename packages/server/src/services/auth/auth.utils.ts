import { AUTH } from './auth.constants';

export function authTokenCreate(): string {
  return authTokenEncode(crypto.getRandomValues(new Uint8Array(32)));
}

export function authPinCreate(): string {
  const range = 10 ** AUTH.pinDigits;
  const limit = Math.floor(2 ** 32 / range) * range;
  const [value = 0] = crypto.getRandomValues(new Uint32Array(1));

  return value < limit ? String(value % range).padStart(AUTH.pinDigits, '0') : authPinCreate();
}

export async function authTokenHash(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return authTokenEncode(new Uint8Array(digest));
}

function authTokenEncode(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
