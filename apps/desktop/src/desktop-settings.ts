import { m } from '@openbots/i18n/client';
import { BuildConfig, PATHS } from 'electrobun/main';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { DESKTOP } from './desktop.constants';
import { desktopSettings, desktopState } from './types/desktop.types';
import type { DesktopSettings, DesktopState } from './types/desktop.types';

const desktopDataDir = process.env.OPENBOTS_DATA_DIR ?? DESKTOP.dataDir;

export const desktopHome = { root: resolve(desktopDataDir.replace(/^~(?=\/|$)/u, homedir())) };

export function desktopSettingsRead(): DesktopSettings {
  const { network = 'all', host } = desktopStateRead();

  return desktopSettings.safeParse({ network, host }).data ?? { network: 'all' };
}

export function desktopSettingsWrite(settings: DesktopSettings): void {
  desktopStateWrite({ network: settings.network, host: settings.network === 'custom' ? settings.host : undefined });
}

export async function desktopSettingsPrompt(host: string): Promise<string | null> {
  const child = Bun.spawn([
    '/usr/bin/osascript', '-e', `on run argv
      try
        activate
        set answer to display dialog (item 1 of argv) with title "Openbots" default answer (item 2 of argv) buttons {item 3 of argv, item 4 of argv} default button 2 cancel button 1
        return text returned of answer
      on error number -128
        return
      end try
    end run`,
    m.desktop_network_custom(), host, m.desktop_cancel(), m.desktop_save(),
  ], { stdout: 'pipe', stderr: 'pipe' });

  const [output, error, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(error.trim());
  }

  return output.trim() || null;
}

export function desktopStateRead(): DesktopState {
  try {
    return desktopState.safeParse(JSON.parse(readFileSync(join(desktopHome.root, DESKTOP.stateFile), 'utf8'))).data ?? {};
  } catch {
    return {};
  }
}

export function desktopStateWrite(patch: Partial<DesktopState>): void {
  mkdirSync(desktopHome.root, { recursive: true, mode: 0o700 });
  writeFileSync(join(desktopHome.root, DESKTOP.stateFile), JSON.stringify({ ...desktopStateRead(), ...patch }, null, 2));
}

function desktopLoginPath(): string {
  return join(homedir(), DESKTOP.login.agents, `${DESKTOP.login.label}.${BuildConfig.getSync().channel}.plist`);
}

function desktopLoginPlist(): string {
  const launcher = join(PATHS.RESOURCES_FOLDER, '..', 'MacOS', 'launcher').replaceAll('&', '&amp;').replaceAll('<', '&lt;');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${DESKTOP.login.label}.${BuildConfig.getSync().channel}</string>
  <key>ProgramArguments</key><array><string>${launcher}</string></array>
  <key>EnvironmentVariables</key><dict><key>${DESKTOP.login.env}</key><string>1</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>ProcessType</key><string>Interactive</string>
</dict>
</plist>
`;
}

export function desktopLoginEnabled(): boolean {
  return existsSync(desktopLoginPath());
}

export function desktopLoginSet(enabled: boolean): void {
  const path = desktopLoginPath();

  if (!enabled) {
    rmSync(path, { force: true });
    return;
  }

  const plist = desktopLoginPlist();

  if (existsSync(path) && readFileSync(path, 'utf8') === plist) {
    return;
  }

  mkdirSync(join(homedir(), DESKTOP.login.agents), { recursive: true });
  writeFileSync(path, plist);
}
