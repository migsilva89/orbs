import { PATHS } from 'electrobun/main';
import { closeSync, mkdirSync, openSync } from 'node:fs';
import { join } from 'node:path';
import { desktopNetworkAdvertise, desktopNetworkOrigins, desktopNetworkUrl } from './desktop-network';
import { desktopHome, desktopStateRead, desktopStateWrite } from './desktop-settings';
import { DESKTOP } from './desktop.constants';
import type { DesktopServer, DesktopSettings } from './types/desktop.types';

export function desktopProcessRuns(pid: number | undefined, marker: string): boolean {
  if (!pid || pid === process.pid) {
    return false;
  }

  const result = Bun.spawnSync(['ps', '-p', String(pid), '-o', 'command='], { stdout: 'pipe', stderr: 'ignore' });

  return result.exitCode === 0 && result.stdout.toString().replaceAll(/\/[^/\s]+\/\.\.(?=\/)/gu, '').includes(marker);
}

async function desktopWaitFor(ready: () => boolean | Promise<boolean>, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  async function desktopAttempt(): Promise<boolean> {
    if (await ready()) {
      return true;
    }

    if (Date.now() >= deadline) {
      return false;
    }

    await Bun.sleep(DESKTOP.healthIntervalMs);

    return desktopAttempt();
  }

  return desktopAttempt();
}

const webDev = process.env.ORBS_WEB_DEV;

export async function desktopServerLeftovers(): Promise<void> {
  const { serverPid } = desktopStateRead();
  const leftover = () => [DESKTOP.serverEntry, DESKTOP.devMarker].some((marker) => desktopProcessRuns(serverPid, marker));

  if (!serverPid || !leftover()) {
    return;
  }

  process.kill(serverPid, 'SIGTERM');

  if (!await desktopWaitFor(() => !leftover(), DESKTOP.leftoverTimeoutMs)) {
    process.kill(serverPid, 'SIGKILL');
  }
}

async function desktopPortAnswers(hostname: string, port: number): Promise<boolean> {
  try {
    const socket = await Bun.connect({
      hostname,
      port,
      socket: { data: () => undefined },
    });

    socket.end();

    return true;
  } catch {
    return false;
  }
}

export async function desktopServerStart(settings: DesktopSettings): Promise<DesktopServer> {
  await desktopServerLeftovers();

  const host = process.env.HOST ?? { all: DESKTOP.allHost, local: DESKTOP.localHost, custom: settings.host ?? DESKTOP.allHost }[settings.network];
  const windowHost = host === DESKTOP.allHost ? DESKTOP.localHost : host;
  const logs = join(desktopHome.root, DESKTOP.logsFolder);
  const logPath = join(logs, DESKTOP.serverLog);

  mkdirSync(logs, { recursive: true });

  async function desktopServerLaunch(port: number): Promise<DesktopServer | null> {
    const busy = await Promise.all([
      desktopPortAnswers(DESKTOP.localHost, port),
      desktopPortAnswers('::1', port),
    ]);

    if (busy.some(Boolean)) {
      return null;
    }

    const url = desktopNetworkUrl(windowHost, port);
    const origins = await desktopNetworkOrigins(port);
    const remote = host === DESKTOP.localHost ? [] : origins.urls;
    const log = openSync(logPath, 'a');

    const command = webDev
      ? [process.execPath, ...DESKTOP.devServer, '--host', host, '--port', String(port)]
      : [process.execPath, join(PATHS.VIEWS_FOLDER, DESKTOP.serverEntry), '--port', String(port)];

    const child = Bun.spawn(command, {
      cwd: webDev ?? desktopHome.root,
      stdout: log,
      stderr: log,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        HOST: host,
        APP_URL: url,
        XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
        ORBS_HOME: process.env.ORBS_HOME,
      },
    });

    closeSync(log);

    const answered = await desktopWaitFor(async () => child.exitCode !== null || (await fetch(`${url}/api/health`).catch(() => null))?.ok === true, DESKTOP.healthTimeoutMs);

    if (!answered || child.exitCode !== null) {
      child.kill('SIGKILL');
      return null;
    }

    desktopStateWrite({ serverPid: child.pid });

    void child.exited.then(host === DESKTOP.localHost ? undefined : desktopNetworkAdvertise(port));

    return {
      url,
      port,
      portFallback: port !== DESKTOP.ports[0],
      tailscale: origins.tailscale,
      urls: [url, ...remote],
      exited: child.exited,
      stop: async () => {
        child.kill('SIGTERM');
        await Promise.race([child.exited, Bun.sleep(DESKTOP.stopTimeoutMs).then(() => child.kill('SIGKILL'))]);
        desktopStateWrite({ serverPid: undefined });
      },
    };
  }

  async function desktopServerTry(ports: number[]): Promise<DesktopServer> {
    if (ports.length === 0) {
      throw new Error(logPath);
    }

    const [port, ...rest] = ports;

    return await desktopServerLaunch(port) ?? desktopServerTry(rest);
  }

  return desktopServerTry(DESKTOP.ports);
}
