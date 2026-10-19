import { Link, useMatches } from '@tanstack/react-router';
import { Fragment } from 'react';
import { match as matchPattern, P } from 'ts-pattern';
import * as Breadcrumb from '@/components/ui/breadcrumb';
import { cn } from '@/lib/cn';
import type { ComponentProps } from 'react';

export function LayoutBreadcrumbs({ className, ...props }: ComponentProps<'nav'>) {
  const matches = useMatches();
  const labels = new Map<string, string>();

  for (const match of matches) {
    const breadcrumb = matchPattern(match.loaderData)
      .with({ breadcrumb: P.string }, (data) => data.breadcrumb)
      .otherwise(() => undefined);

    if (breadcrumb) {
      labels.set(match.pathname.replace(/(.)\/$/, '$1'), breadcrumb);
    }
  }

  const paths = (matches.at(-1)?.pathname ?? '/').split('/').filter(Boolean);

  const displayBreadcrumbs = paths.flatMap((_, idx) => {
    const href = `/${paths.slice(0, idx + 1).join('/')}`;
    const label = labels.get(href);

    return label ? [{ href, label }] : [];
  });

  if (displayBreadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb.Breadcrumb className={cn('max-w-full', className)} {...props}>
      <Breadcrumb.BreadcrumbList className="snap-x flex-nowrap gap-1 overflow-x-auto sm:gap-1">
        {displayBreadcrumbs.map((breadcrumb, idx) => {
          const isLast = idx === displayBreadcrumbs.length - 1;
          return (
            <Fragment key={breadcrumb.href}>
              <Breadcrumb.BreadcrumbItem>
                {isLast ? (
                  <Breadcrumb.BreadcrumbPage className="truncate">{breadcrumb.label}</Breadcrumb.BreadcrumbPage>
                ) : (
                  <Breadcrumb.BreadcrumbLink asChild>
                    <Link className="truncate" to={breadcrumb.href}>
                      {breadcrumb.label}
                    </Link>
                  </Breadcrumb.BreadcrumbLink>
                )}
              </Breadcrumb.BreadcrumbItem>
              {!isLast ? <Breadcrumb.BreadcrumbSeparator /> : null}
            </Fragment>
          );
        })}
      </Breadcrumb.BreadcrumbList>
    </Breadcrumb.Breadcrumb>
  );
}
