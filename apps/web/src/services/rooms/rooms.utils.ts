export function roomsFold(text: string) {
  return text.normalize('NFD').replaceAll(/\p{M}/gu, '').toLowerCase();
}
