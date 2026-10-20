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
  let viewportFrame: number | undefined;

  function layoutUpdateViewport() {
    if (viewport && viewport.scale !== 1) {
      return;
    }

    const height = viewport?.height ?? window.innerHeight;
    const top = viewport?.offsetTop ?? 0;
    fullHeight = Math.max(fullHeight, height);

    if (height < fullHeight - 40) {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }

      root.dataset.keyboard = 'open';
    } else {
      delete root.dataset.keyboard;
    }

    root.style.setProperty('--app-height', `${height}px`);
    root.style.setProperty('--app-top', `${top}px`);
  }

  function layoutScheduleViewport() {
    viewportFrame ??= requestAnimationFrame(() => {
      viewportFrame = undefined;
      layoutUpdateViewport();
    });
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
    layoutScheduleViewport();
  });

  viewport?.addEventListener('resize', layoutScheduleViewport);
  viewport?.addEventListener('scroll', layoutScheduleViewport);
  window.addEventListener('resize', layoutScheduleViewport);
  window.addEventListener('pageshow', layoutScheduleViewport);
  media.addEventListener('change', layoutUpdateMode);
  layoutUpdateMode();
  layoutUpdateViewport();
}
