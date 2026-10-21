import { m } from '@openbots/i18n/client';
import { Electroview } from 'electrobun/view';
import { DESKTOP } from '../../desktop.constants';
import type { DesktopConnectView, DesktopRPC } from '../../types/desktop.types';

const rpc = Electroview.defineRPC<DesktopRPC>({ maxRequestTime: Infinity, handlers: { requests: {}, messages: {} } });

const electroview = new Electroview({ rpc });

function connectElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing ${selector}`);
  }

  return element;
}

const choose = connectElement<HTMLElement>('#choose');
const unreachable = connectElement<HTMLElement>('#unreachable');
const form = connectElement<HTMLFormElement>('#form');
const addressField = connectElement<HTMLLabelElement>('#address-field');
const address = connectElement<HTMLInputElement>('#address');
const error = connectElement<HTMLParagraphElement>('#error');
const submit = connectElement<HTMLButtonElement>('#submit');
const retry = connectElement<HTMLButtonElement>('#retry');
const change = connectElement<HTMLButtonElement>('#change');
const unreachableTitle = connectElement<HTMLHeadingElement>('#unreachable-title');
const current = connectElement<HTMLElement>('#current');
const status = connectElement<HTMLElement>('#current-status');
const found = connectElement<HTMLElement>('#found');
const foundLabel = connectElement<HTMLElement>('#found-label');
const foundList = connectElement<HTMLElement>('#found-list');

const copy: Record<string, string> = {
  '#choose-title': m.desktop_connect_title(),
  '#current-title': m.desktop_connection_current(),
  '#current-mode-label': m.desktop_connection_mode(),
  '#current-address-label': m.desktop_connect_address(),
  '#current-network-label': m.desktop_connection_network(),
  '#current-status-label': m.desktop_connection_status(),
  '#current-status': m.desktop_connection_checking(),
  '#choose-hint': m.desktop_connect_hint(),
  '#local-label': m.desktop_connect_local(),
  '#local-hint': m.desktop_connect_local_hint(),
  '#remote-label': m.desktop_connect_remote(),
  '#remote-hint': m.desktop_connect_remote_hint(),
  '#address-label': m.desktop_connect_address(),
  '#submit': m.desktop_connect_button(),
  '#retry': m.desktop_retry(),
  '#change': m.desktop_change(),
  '#unreachable-hint': m.desktop_unreachable_hint(),
};

for (const [selector, text] of Object.entries(copy)) {
  connectElement(selector).textContent = text;
}

address.placeholder = m.desktop_connect_placeholder();

let busy = false;
let checking = false;
let finding: Promise<void> | null = null;

async function connectHealth(): Promise<void> {
  if (checking || current.hidden || busy) {
    return;
  }

  checking = true;

  try {
    const connected = await rpc.request.connectHealth();
    status.textContent = connected ? m.desktop_connection_connected() : m.desktop_connection_offline();
  } finally {
    checking = false;
  }
}

function connectRemote(): boolean {
  return new FormData(form).get('mode') === 'remote';
}

function connectFind(): Promise<void> {
  found.hidden = false;
  foundLabel.textContent = m.desktop_connect_finding();

  return rpc.request.connectFind().then((servers) => {
    foundLabel.textContent = m.desktop_connect_found();
    found.hidden = servers.length === 0;
    foundList.replaceChildren(...servers.map((server) => {
      const button = document.createElement('button');

      button.type = 'button';
      button.className = 'outline';
      button.title = server.url;
      button.textContent = server.name;
      button.addEventListener('click', () => {
        address.value = server.url;
        error.hidden = true;
      });

      return button;
    }));
  });
}

function connectMode(): void {
  addressField.hidden = !connectRemote();
  found.hidden = !connectRemote() || foundList.childElementCount === 0;
  error.hidden = true;

  if (connectRemote()) {
    address.focus();
    finding ??= connectFind();
  }
}

function connectBusy(button: HTMLButtonElement, value: boolean): void {
  busy = value;
  button.setAttribute('aria-busy', String(value));

  for (const control of [submit, retry, change, address, ...form.querySelectorAll('input')]) {
    control.disabled = value;
  }
}

function connectShow(view: DesktopConnectView): void {
  const host = URL.parse(view.address)?.host ?? view.address;

  choose.hidden = view.screen !== 'choose';
  unreachable.hidden = view.screen !== 'unreachable';
  unreachableTitle.textContent = m.desktop_unreachable_title({ host });
  address.value = view.address;
  current.hidden = !view.current;

  if (view.current) {
    connectElement('#current-mode').textContent = view.remote ? m.desktop_connect_remote() : m.desktop_connect_local();
    connectElement('#current-address').textContent = view.current.address;

    const networks = { local: m.desktop_connect_local(), tailscale: m.desktop_connection_tailscale(), unknown: m.desktop_connection_unknown() };

    connectElement('#current-network').textContent = networks[view.current.network];
    void connectHealth();
  }

  form.querySelector<HTMLInputElement>(`input[value="${view.remote ? 'remote' : 'local'}"]`)?.click();
  connectMode();
}

async function connectRetry(): Promise<void> {
  if (busy || unreachable.hidden) {
    return;
  }

  connectBusy(retry, true);
  await rpc.request.connectRetry();
  connectBusy(retry, false);
}

form.addEventListener('change', connectMode);

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const params = connectRemote() ? { address: address.value } : {};

  connectBusy(submit, true);
  error.hidden = true;

  void rpc.request.connect(params).then((result) => {
    connectBusy(submit, false);
    error.textContent = result.error ?? '';
    error.hidden = !result.error;
  });
});

retry.addEventListener('click', () => void connectRetry());

change.addEventListener('click', () => {
  choose.hidden = false;
  unreachable.hidden = true;
  connectMode();
});

setInterval(() => {
  void connectRetry();
  void connectHealth();
}, DESKTOP.connectRetryMs);

void rpc.request.connectLoad().then(connectShow);
void electroview;
