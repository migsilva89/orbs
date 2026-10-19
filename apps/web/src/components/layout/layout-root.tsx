import { m } from '@openbots/i18n/client';
import { getLocale } from '@openbots/i18n/runtime';
import { ClientOnly, HeadContent, Scripts } from '@tanstack/react-router';
import { ContextProviders } from '@/components/context/context-providers';
import { ContextShellScript } from '@/components/context/context-shell';
import { ContextThemeScript } from '@/components/context/context-theme';
import { LayoutInstallPrompt } from '@/components/layout/layout-install-prompt';
import type { ErrorComponentProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';

interface LayoutRootErrorProps {
  error: ErrorComponentProps['error']
}

export function LayoutRootError({ error }: LayoutRootErrorProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-24">
      <h1 className="text-3xl font-medium tracking-tight">{error instanceof Error ? error.message : String(error)}</h1>
    </main>
  );
}

export function LayoutRootNotFound() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-24">
      <h1 className="text-3xl font-medium tracking-tight">{m.layout_not_found()}</h1>
    </main>
  );
}

interface LayoutRootDocumentProps {
  children: ReactNode
}

export function LayoutRootDocument({ children }: LayoutRootDocumentProps) {
  return (
    <html suppressHydrationWarning lang={getLocale()}>
      <head>
        <HeadContent />
        <ContextThemeScript />
        <ContextShellScript />
      </head>
      <body className="relative">
        <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 hidden h-13 electrobun-webkit-app-region-drag select-none desktop:block [body:has([data-slot=sidebar-wrapper])_&]:hidden!" />
        <ContextProviders>
          {children}
          <ClientOnly>
            <LayoutInstallPrompt />
          </ClientOnly>
        </ContextProviders>
        <Scripts />
      </body>
    </html>
  );
}
