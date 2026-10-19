export interface AlarmBotParams {
  botId: string;
}

export interface AlarmSetParams extends AlarmBotParams {
  at: number;
}

export type AlarmHandler = (params: AlarmBotParams) => void;

/**
 * Host wake-up port, one alarm per bot. Like a Durable Object alarm, `set` replaces the previous time.
 * Pi owns the work and its saved deadlines; the alarm only makes sure the host is awake to `resume()` it.
 */
export interface AlarmService {
  set(params: AlarmSetParams): void;
  clear(params: AlarmBotParams): void;
  listen(handler: AlarmHandler): () => void;
  close(): void;
}
