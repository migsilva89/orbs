import { initLog, log } from 'evlog/client';

initLog({
  service: 'openbots',
  console: Boolean(import.meta.env.DEV),
  pretty: Boolean(import.meta.env.DEV),
  transport: {
    enabled: true,
    endpoint: '/t/ingest',
  },
});

export { log };
