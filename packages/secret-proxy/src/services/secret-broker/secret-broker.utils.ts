/** Quotes one word for `sh`. */
export function secretBrokerQuote(word: string) {
  return `'${word.replaceAll("'", String.raw`'\''`)}'`;
}
