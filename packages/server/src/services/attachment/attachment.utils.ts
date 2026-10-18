export function attachmentName(name: string): string {
  const cleaned = name.normalize('NFC').replace(/[\p{Cc}/\\]/gu, '_').replace(/^\.+/, '_');
  const bytes = new TextEncoder().encode(cleaned).slice(0, 200);
  return new TextDecoder().decode(bytes).replace(/\uFFFD$/u, '') || 'file';
}
