import { getLocale } from '@repo/i18n/runtime';
import { ContextThemeScript } from '@repo/ui/context/context-theme';
import { LayoutError, LayoutNotFound } from '@repo/ui/layout/layout-error';
import { ClientOnly, HeadContent, Scripts } from '@tanstack/react-router';
import { ContextProviders } from '@/components/context/context-providers';
import { ContextShellScript } from '@/components/context/context-shell';
import { LayoutInstallPrompt } from '@/components/layout/layout-install-prompt';
import type { ErrorComponentProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';

interface LayoutRootErrorProps {
  error: ErrorComponentProps['error']
}

export function LayoutRootError({ error }: LayoutRootErrorProps) {
  return (
    <main className="flex h-svh">
      <LayoutError error={error} />
    </main>
  );
}

export function LayoutRootNotFound() {
  return (
    <main className="flex h-svh">
      <LayoutNotFound />
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
