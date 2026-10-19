import { createIsomorphicFn } from '@tanstack/react-start';
import { LAYOUT_INSTALL_DISMISSED_KEY, LAYOUT_SIDEBAR_COOKIES } from './layout.constants';
import type { LayoutSidebarsOpen } from '@/types/layout.types';

const layoutCookies = createIsomorphicFn()
  .server(async () => {
    const { getRequest } = await import('@tanstack/react-start/server');

    return getRequest().headers.get('cookie') ?? '';
  })
  .client(() => Promise.resolve(document.cookie));

export function layoutShowInstallPrompt(): boolean {
  const ios = /iPad|iPhone|iPod/u.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const safari = /Version\/.+Safari\//u.test(navigator.userAgent)
    && !/CriOS|FxiOS|EdgiOS|OPiOS/u.test(navigator.userAgent);

  try {
    return ios && safari && !document.documentElement.dataset.shell
      && localStorage.getItem(LAYOUT_INSTALL_DISMISSED_KEY) !== 'true';
  } catch {
    return false;
  }
}

export async function layoutSidebarsOpen(): Promise<LayoutSidebarsOpen> {
  const cookies = new URLSearchParams((await layoutCookies()).replaceAll('; ', '&'));

  return { rooms: cookies.get(LAYOUT_SIDEBAR_COOKIES.rooms) !== 'false', details: cookies.get(LAYOUT_SIDEBAR_COOKIES.details) === 'true' };
}

export function layoutApplyShell(): void {
  const root = document.documentElement;

  if (window.__electrobunWindowId !== undefined) {
    root.dataset.shell = 'desktop';

    return;
  }

  const media = window.matchMedia('(display-mode: standalone)');
  const viewport = window.visualViewport;
  let fullHeight = 0;
  let closing: ReturnType<typeof setTimeout> | undefined;

  function layoutUpdateViewport() {
    if (viewport && viewport.scale !== 1) {
      return;
    }

    const height = viewport?.height ?? window.innerHeight;
    fullHeight = Math.max(fullHeight, height);

    if (closing !== undefined && height < fullHeight - 40) {
      return;
    }

    if (height < fullHeight - 40) {
      root.dataset.keyboard = 'open';

      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    } else {
      delete root.dataset.keyboard;
    }

    root.style.setProperty('--app-height', `${height}px`);
    root.style.setProperty('--app-top', `${viewport?.offsetTop ?? 0}px`);
  }

  function layoutCloseKeyboard(event: FocusEvent) {
    const next = event.relatedTarget;

    if (root.dataset.keyboard !== 'open' || (next instanceof Element && next.matches('input, textarea, [contenteditable="true"]'))) {
      return;
    }

    clearTimeout(closing);
    closing = setTimeout(() => {
      closing = undefined;
      layoutUpdateViewport();
    }, 1000);

    delete root.dataset.keyboard;
    root.style.setProperty('--app-height', `${fullHeight}px`);
    root.style.setProperty('--app-top', '0px');
  }

  function layoutUpdateMode() {
    if (media.matches || navigator.standalone === true) {
      root.dataset.shell = 'standalone';
    } else {
      delete root.dataset.shell;
    }
  }

  screen.orientation.addEventListener('change', () => {
    fullHeight = 0;
    layoutUpdateViewport();
  });

  viewport?.addEventListener('resize', layoutUpdateViewport);
  viewport?.addEventListener('scroll', layoutUpdateViewport);
  window.addEventListener('resize', layoutUpdateViewport);
  window.addEventListener('pageshow', layoutUpdateViewport);
  document.addEventListener('focusout', layoutCloseKeyboard);
  media.addEventListener('change', layoutUpdateMode);
  layoutUpdateMode();
  layoutUpdateViewport();
}
