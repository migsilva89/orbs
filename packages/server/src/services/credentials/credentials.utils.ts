export function credentialsEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export function credentialsDecode(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}
