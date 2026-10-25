import { ORPCError } from '@orpc/client';
import { errorSchemas } from '@repo/errors/universal';
import { m } from '@repo/i18n/client';
import { log } from '@repo/logger/client';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { Link, useCanGoBack, useRouter } from '@tanstack/react-router';
import { useEffect, useTransition } from 'react';
import { match, P } from 'ts-pattern';
import { AvatarBlob } from '@/components/avatars/avatar-blob';
import { Button } from '@/components/ui/button';
import { ButtonLoading } from '@/components/ui/button-loading';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import type { ErrorComponentProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';

interface LayoutErrorProps {
  error: ErrorComponentProps['error']
}

export function LayoutError({ error }: LayoutErrorProps) {
  const router = useRouter();
  const queryErrorReset = useQueryErrorResetBoundary();
  const [isRetrying, startRetry] = useTransition();

  const isError = (code: 'NOT_FOUND' | 'SERVER_UNREACHABLE') => (error instanceof ORPCError
    ? error.code === code
    : error instanceof Error && error.message === errorSchemas[code].message);

  const kind = match(error)
    .when(() => isError('NOT_FOUND'), () => 'notFound' as const)
    .when(() => isError('SERVER_UNREACHABLE'), () => 'unreachable' as const)
    .otherwise(() => 'failed' as const);

  const detail = match({ kind, error })
    .with({ kind: 'failed', error: P.instanceOf(Error) }, ({ error: failure }) => failure.message)
    .with({ kind: 'failed' }, () => String(error))
    .otherwise(() => undefined);

  const retry = () => startRetry(() => router.invalidate());

  useEffect(() => queryErrorReset.reset(), [queryErrorReset]);

  useEffect(() => {
    if (kind === 'failed') {
      log.error({ action: 'route_error', error });
    }
  }, [kind, error]);

  useEffect(() => {
    if (kind !== 'unreachable') {
      return;
    }

    const retryOnline = () => startRetry(() => router.invalidate());
    window.addEventListener('online', retryOnline);

    return () => window.removeEventListener('online', retryOnline);
  }, [kind, router]);

  if (kind === 'notFound') {
    return <LayoutNotFound />;
  }

  return (
    <LayoutErrorState
      description={kind === 'unreachable' ? m.layout_unreachable_description() : m.layout_error_description()}
      detail={detail}
      title={kind === 'unreachable' ? m.layout_unreachable_title() : m.layout_error_title()}
    >
      <ButtonLoading loading={isRetrying} onClick={retry}>{m.layout_retry()}</ButtonLoading>
    </LayoutErrorState>
  );
}

export function LayoutNotFound() {
  return <LayoutErrorState description={m.layout_not_found_description()} title={m.layout_not_found_title()} />;
}

interface LayoutErrorStateProps {
  title: string
  description: string
  detail?: string
  children?: ReactNode
}

function LayoutErrorState({ title, description, detail, children }: LayoutErrorStateProps) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const variant = children ? 'ghost' : undefined;

  return (
    <Empty className="min-h-full">
      <EmptyHeader>
        <AvatarBlob
          className="mb-4"
          expression="sad"
          size={96}
        />
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
        {detail ? <code className="max-w-sm font-mono text-xxs break-all text-muted-foreground">{detail}</code> : null}
      </EmptyHeader>
      <EmptyContent>
        {children}
        {canGoBack ? (
          <Button variant={variant} onClick={() => router.history.back()}>{m.layout_back()}</Button>
        ) : (
          <Button asChild variant={variant}>
            <Link to="/rooms">{m.layout_home()}</Link>
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}
