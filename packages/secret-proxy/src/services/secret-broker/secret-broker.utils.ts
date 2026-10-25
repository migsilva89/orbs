export function secretBrokerQuote(word: string) {
  return `'${word.replaceAll("'", String.raw`'\''`)}'`;
}
