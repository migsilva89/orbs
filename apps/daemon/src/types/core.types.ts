import type { makeServices } from '@repo/server/server';
import type { Server } from 'bun';

export type CoreServices = Awaited<ReturnType<typeof makeServices>>;

export type CoreHandler<T extends Request> = (request: T, server: Server<undefined>) => Response | undefined | Promise<Response | undefined>;

export type CorePairingCode = Awaited<ReturnType<CoreServices['auth']['actions']['bootstrap']>>['qr'];
