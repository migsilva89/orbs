import { SERVER_PROTOCOL } from '@repo/contracts/universal';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import type { Page } from 'playwright';

const root = path.resolve(import.meta.dir, '..');
const output = path.join(root, 'apps/web/public/img/onboarding');
const envFile = path.join(root, '.env');

// Demo content for the onboarding screenshots. Nothing here comes from a real account.
const BOTS = [
  { name: 'Atlas', handle: 'atlas', body: 'circle', color: 'blue', expression: 'happy', modelId: 'claude-opus-5-5', permission: 'ask' },
  { name: 'Juniper', handle: 'juniper', body: 'cloud', color: 'pink', expression: 'curious', modelId: 'claude-sonnet-4-5', permission: 'ask' },
  { name: 'Pixel', handle: 'pixel', body: 'triangle', color: 'amber', expression: 'excited', modelId: 'claude-haiku-5-5', permission: 'ask' },
  { name: 'Morrow', handle: 'morrow', body: 'squircle', color: 'green', expression: 'proud', modelId: 'claude-opus-5', permission: 'read-only' },
  { name: 'Sol', handle: 'sol', body: 'droplet', color: 'violet', expression: 'shy', modelId: 'claude-haiku-5-5', permission: 'ask' },
];

// A null reply makes the mock model ask to run `npm test`, which leaves an approval card waiting.
const CHATS = [
  { handle: 'morrow', message: 'Summarize yesterday\'s meeting notes', reply: 'Done. The notes are in summary.md: two decisions, three follow-ups, and one open question for Friday.' },
  { handle: 'sol', message: 'Hey! What can you do?', reply: 'I can read your files, run commands when you say so, and keep track of your todos. What should we start with?' },
  { handle: 'sol', message: 'Can you keep an eye on my todos this week?', reply: 'Sure. I added a check every morning at 9 and I\'ll ping you when something is due or overdue.' },
  { handle: 'sol', message: 'Perfect, and remind me about the design review Thursday', reply: 'Done. I\'ll remind you Thursday at 10, an hour before the review.' },
  { handle: 'juniper', message: 'Can you run the tests before I merge?', reply: null },
  { handle: 'atlas', message: 'Morning! What\'s on my plate today?', reply: 'Three things today: review the onboarding PR, reply to the design thread, and the 3pm sync. Want me to draft the reply first?' },
];

// Clips are 800px wide CSS pixels in a 1440x900 window. padTop stretches the top row for crops that start at the page edge.
const SHOTS = [
  { name: 'welcome', route: '/rooms/direct/atlas', x: 0, y: 0, height: 340, padTop: 28, scrollTo: null },
  { name: 'model', route: '/settings', x: 440, y: 0, height: 340, padTop: 0, scrollTo: 'providers' },
  { name: 'approvals', route: '/rooms/direct/juniper', x: 460, y: 90, height: 340, padTop: 0, scrollTo: null },
  { name: 'bot', route: '/bots/{atlas}', x: 448, y: 60, height: 340, padTop: 0, scrollTo: null },
  { name: 'done', route: '/rooms/direct/sol', x: 440, y: 60, height: 460, padTop: 0, scrollTo: null },
];

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

async function inOrder<T>(items: readonly T[], step: (item: T) => Promise<void>): Promise<void> {
  await items.reduce<Promise<void>>(async (previous, item) => {
    await previous;
    await step(item);
  }, Promise.resolve());
}

function freePort(): number {
  const server = Bun.serve({ port: 0, fetch: () => new Response() });
  const { port } = server;

  void server.stop(true);

  return port ?? fail('No free port');
}

async function waitFor<T>(label: string, check: () => Promise<T | null> | T | null, deadline = Date.now() + 90_000): Promise<T> {
  const value = await check();

  if (value !== null) {
    return value;
  }

  if (Date.now() > deadline) {
    throw new Error(`Timed out waiting for ${label}`);
  }

  await Bun.sleep(250);

  return waitFor(label, check, deadline);
}

function mockAnthropic(port: number) {
  const sse = (events: [string, unknown][]) => events.map(([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join('');

  return Bun.serve({
    port,
    async fetch(request) {
      const body = await request.json() as { model: string, messages: { role: string, content: string | { type: string, text?: string }[] }[] };
      const last = body.messages.findLast((message) => message.role === 'user');
      const blocks = typeof last?.content === 'string' ? [{ type: 'text', text: last.content }] : (last?.content ?? []);
      const text = blocks.filter((block) => block.type === 'text').map((block) => block.text).join(' ');
      const isToolResult = blocks.some((block) => block.type === 'tool_result');
      const chat = CHATS.find((item) => text.includes(item.message));
      const isTool = chat?.reply === null && !isToolResult;

      const start = isTool
        ? {
          type: 'tool_use',
          id: 'toolu_demo',
          name: 'bash',
          input: {},
        }
        : { type: 'text', text: '' };

      const delta = isTool
        ? { type: 'input_json_delta', partial_json: JSON.stringify({ command: 'npm test' }) }
        : { type: 'text_delta', text: chat?.reply ?? 'On it.' };

      const message = {
        id: 'msg_demo',
        type: 'message',
        role: 'assistant',
        model: body.model,
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 40, output_tokens: 1 },
      };

      return new Response(sse([
        ['message_start', { type: 'message_start', message }],
        [
          'content_block_start',
          {
            type: 'content_block_start',
            index: 0,
            content_block: start,
          },
        ],
        [
          'content_block_delta',
          {
            type: 'content_block_delta',
            index: 0,
            delta,
          },
        ],
        ['content_block_stop', { type: 'content_block_stop', index: 0 }],
        [
          'message_delta',
          {
            type: 'message_delta',
            delta: { stop_reason: isTool ? 'tool_use' : 'end_turn', stop_sequence: null },
            usage: { output_tokens: 32 },
          },
        ],
        ['message_stop', { type: 'message_stop' }],
      ]), { headers: { 'content-type': 'text/event-stream' } });
    },
  });
}

async function rpc(page: Page, procedure: string, input: unknown) {
  return page.evaluate(async ({ name, body, protocol }) => {
    const connection = document.cookie.split('; ')
      .map((entry) => {
        try {
          return JSON.parse(decodeURIComponent(entry.slice(entry.indexOf('=') + 1)));
        } catch {
          return null;
        }
      })
      .find((value) => value?.token && value?.serverId);

    const response = await fetch(`/rpc/${name}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [protocol.versionHeader]: String(protocol.version),
        [protocol.serverIdHeader]: connection.serverId,
        authorization: `Bearer ${connection.token}`,
      },
      body: JSON.stringify({ json: body }),
    });

    if (!response.ok) {
      throw new Error(`${name} failed with ${response.status}`);
    }

    return (await response.json()).json;
  }, {
    name: procedure,
    body: input,
    protocol: SERVER_PROTOCOL,
  });
}

async function encode(page: Page, png: Buffer, padTop: number): Promise<Buffer> {
  const data = await page.evaluate(async ({ source, pad }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${source}`;
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('No canvas context');
    }

    context.drawImage(image, 0, 0, image.width, 1, 0, 0, image.width, pad);
    context.drawImage(image, 0, 0, image.width, image.height - pad, 0, pad, image.width, image.height - pad);

    return canvas.toDataURL('image/webp', 0.82).split(',')[1];
  }, { source: png.toString('base64'), pad: padTop });

  return Buffer.from(data, 'base64');
}

async function screenshots() {
  const temp = mkdtempSync(path.join(tmpdir(), 'orbs-screenshots-'));
  const [mockPort, daemonPort, webPort] = [freePort(), freePort(), freePort()];
  const web = `http://localhost:${webPort}`;
  const daemonLog = path.join(temp, 'daemon.log');

  mkdirSync(path.join(temp, 'pi'));
  writeFileSync(path.join(temp, 'pi/models.json'), JSON.stringify({ providers: { anthropic: { baseUrl: `http://127.0.0.1:${mockPort}` } } }));
  writeFileSync(path.join(temp, 'pi/auth.json'), JSON.stringify({ anthropic: { type: 'api_key', key: 'demo-not-real' }, openai: { type: 'api_key', key: 'demo-not-real' } }), { mode: 0o600 });

  const browser = await chromium.launch();
  const mock = mockAnthropic(mockPort);
  const envArgs = existsSync(envFile) ? [`--env-file=${envFile}`] : [];

  const daemon = Bun.spawn([
    'bun',
    ...envArgs,
    'src/entry.native.ts',
  ], {
    cwd: path.join(root, 'apps/daemon'),
    env: {
      ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.endsWith('_API_KEY'))),
      DATA_DIR: temp,
      PI_CODING_AGENT_DIR: path.join(temp, 'pi'),
      DAEMON_HOST: '127.0.0.1',
      DAEMON_PORT: String(daemonPort),
      WEB_PUBLIC_URL: web,
    },
    stdout: Bun.file(daemonLog),
    stderr: Bun.file(daemonLog),
  });

  const vite = Bun.spawn([
    'bunx',
    'vite',
    'dev',
    '--port',
    String(webPort),
    '--strictPort',
  ], {
    cwd: path.join(root, 'apps/web'),
    env: { ...process.env, DAEMON_PORT: String(daemonPort) },
    stdout: 'ignore',
    stderr: 'ignore',
  });

  try {
    const pairingPattern = new RegExp(`${web}/connect#code=\\S+`);
    const pairing = await waitFor('the pairing link', () => (existsSync(daemonLog) ? pairingPattern.exec(readFileSync(daemonLog, 'utf8'))?.[0] ?? null : null));

    await waitFor('the web server', async () => (await fetch(web).catch(() => null))?.status ?? null);

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
    const page = await context.newPage();
    const encoder = await context.newPage();
    const ids: Record<string, string> = {};

    await page.goto(pairing);
    await page.waitForURL('**/onboarding/**', { timeout: 60_000 });

    await inOrder(BOTS, async (bot) => {
      const created = await rpc(page, 'bots/create', {
        name: bot.name,
        handle: bot.handle,
        avatar: {
          kind: 'blob',
          body: bot.body,
          color: bot.color,
          expression: bot.expression,
        },
        modelProvider: 'anthropic',
        modelId: bot.modelId,
        thinkingLevel: 'medium',
        permission: bot.permission,
      });

      ids[bot.handle] = created.id;
    });

    await rpc(page, 'onboarding/complete', null);

    await inOrder(CHATS, async (chat) => {
      await page.goto(`${web}/rooms/direct/${chat.handle}`);
      await page.getByRole('textbox').first().fill(chat.message);
      await page.keyboard.press('Enter');
      await page.getByText(chat.reply ?? 'npm test').first().waitFor({ timeout: 30_000 });
    });

    await inOrder(['dark', 'light'] as const, async (colorScheme) => {
      await page.emulateMedia({ colorScheme });

      await inOrder(SHOTS, async (shot) => {
        await page.goto(`${web}${shot.route.replace('{atlas}', ids.atlas)}`);
        await page.waitForLoadState('networkidle');

        if (shot.scrollTo) {
          await page.locator(`#${shot.scrollTo}`).evaluate((element) => element.scrollIntoView({ block: 'start' }));
        }

        await page.waitForTimeout(600);

        const clip = {
          x: shot.x,
          y: shot.y,
          width: 800,
          height: shot.height,
        };

        const png = await page.screenshot({ clip });

        writeFileSync(path.join(output, `${shot.name}-${colorScheme}.webp`), await encode(encoder, png, shot.padTop));
        console.log(`Saved ${shot.name}-${colorScheme}.webp`);
      });
    });
  } finally {
    await browser.close();
    daemon.kill();
    vite.kill();
    await mock.stop(true);
    await Promise.all([
      daemon.exited,
      vite.exited,
    ]);
    rmSync(temp, { recursive: true, force: true });
  }
}

const commands = { screenshots };
const command = process.argv[2] ?? '';

if (!(command in commands)) {
  fail('Usage: bun scripts/web.ts screenshots');
}

await commands[command as keyof typeof commands]();
