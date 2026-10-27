export interface AnimatedCounterDigit {
  kind: 'digit'
  key: string
  digit: number
  order: number
}

export interface AnimatedCounterSymbol {
  kind: 'symbol'
  key: string
  text: string
}

export type AnimatedCounterPart = AnimatedCounterDigit | AnimatedCounterSymbol;
