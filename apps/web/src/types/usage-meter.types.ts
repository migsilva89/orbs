export interface UsageMeterPart {
  label: string
  value: number
}

export type UsageMeterStatus = 'ok' | 'near' | 'over';

export type UsageMeterGlyph = { kind: 'digit', key: string, digit: number } | { kind: 'text', key: string, text: string };

export interface UsageMeterItem {
  id: string
  label: string
  value: number
  isFree: boolean
}
