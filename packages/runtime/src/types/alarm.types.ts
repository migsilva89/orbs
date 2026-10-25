export interface AlarmBotParams {
  botId: string;
}

export interface AlarmSetParams extends AlarmBotParams {
  at: number;
}

export type AlarmHandler = (params: AlarmBotParams) => void;

export interface AlarmServiceDeps {
  timers: Map<string, ReturnType<typeof setTimeout>>;
  handlers: Set<AlarmHandler>;
}

export interface AlarmService {
  set(params: AlarmSetParams): void;
  clear(params: AlarmBotParams): void;
  listen(handler: AlarmHandler): () => void;
  close(): void;
}
