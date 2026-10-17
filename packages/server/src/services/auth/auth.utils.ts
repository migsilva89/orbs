export function authTokenCreate(): string {
  return authTokenEncode(crypto.getRandomValues(new Uint8Array(32)));
}

export async function authTokenHash(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return authTokenEncode(new Uint8Array(digest));
}

function authTokenEncode(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
