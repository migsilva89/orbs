export const ACTIVITY = {
  pageSize: 20,
  tracePage: 100,
  maxTracePages: 5,
  runWindowMs: 6 * 60 * 60 * 1000,
  titleChars: 160,
  inputChars: 300,
  maxInputEntries: 200,
  span: {
    submit: 'pi.durable.submit',
    phase: 'pi.durable.phase',
    request: 'pi.ai.request',
  },
  event: {
    entry: 'pi.durable.entry',
    submission: 'pi.durable.submission',
    block: 'pi.ai.block',
  },
  task: {
    generation: 'pi.generation',
    tool: 'pi.tool',
  },
} as const;
