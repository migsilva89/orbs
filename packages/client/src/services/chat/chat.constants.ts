export const CHAT = {
  attachmentScheme: 'attachment:',
  entryPrefix: 'entry-',
  liveMessageId: 'live',
  outgoingPrefix: 'outgoing-',
  historyPageSize: 50,
  aroundPageSize: 25,
  reactionsPageSize: 100,
  peerNotePattern: /^\[[^\]\n]*\]\n\n/u,
} as const;
