import { linkFaviconUrl, linkHost } from '@repo/client/client';
import { rpcContext } from '@repo/client/react';
import { useQuery } from '@tanstack/react-query';
import { Link, useRouter } from '@tanstack/react-router';
import { use, useState } from 'react';
import IconArrowUpRight from '~icons/lucide/arrow-up-right';
import { cn } from '../../lib/cn';
import { linkInternalPath } from '../../lib/link';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../hover-card';
import { Skeleton } from '../skeleton';
import type { RpcContextValue } from '@repo/client/react';
import type { ComponentProps } from 'react';
import type { ExtraProps } from 'streamdown';

// Soft blue on the page; inside the owner's bubble a link keeps the bubble's text colour and its underline.
const responseLinkClass = 'font-medium text-link decoration-current/35 underline-offset-2 transition-colors wrap-break-word hover:underline group-data-[role=user]:text-current group-data-[role=user]:underline';

function ResponseLinkFavicon({ src, className }: { src: string, className?: string }) {
  return <img alt="" className={cn('inline-block size-[1.1em] shrink-0 rounded-sm align-[-0.2em]', className)} decoding="async" loading="lazy" referrerPolicy="no-referrer" src={src} />;
}

interface ResponseLinkPreviewProps {
  rpc: RpcContextValue['rpc']
  href: string
  host: string
  favicon: string
}

function ResponseLinkPreview({ rpc, href, host, favicon }: ResponseLinkPreviewProps) {
  const [isImageBroken, setImageBroken] = useState(false);

  const { data: preview, isPending } = useQuery({
    ...rpc.links.preview.queryOptions({ input: { url: href } }),
    staleTime: Infinity,
    retry: false,
  });

  return (
    <a className="flex flex-col outline-none" href={href} rel="noopener noreferrer" target="_blank">
      {isPending ? <Skeleton className="mb-3 aspect-[1.91] w-full" /> : null}
      {preview?.imageUrl && !isImageBroken ? <img alt="" className="mb-3 aspect-[1.91] w-full rounded-md border object-cover" referrerPolicy="no-referrer" src={preview.imageUrl} onError={() => setImageBroken(true)} /> : null}
      {isPending ? <Skeleton className="h-4 w-3/4" /> : null}
      {preview?.title ? <span className="line-clamp-2 text-sm font-medium">{preview.title}</span> : null}
      {preview?.description ? <span className="mt-1 line-clamp-3 text-xs text-muted-foreground">{preview.description}</span> : null}
      <span className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ResponseLinkFavicon className="size-4 align-middle" src={favicon} />
        <span className="min-w-0 flex-1 truncate">{preview?.siteName ?? host}</span>
        <IconArrowUpRight className="size-3.5 shrink-0" />
      </span>
    </a>
  );
}

export function ResponseLink({ node: _node, href = '', className, children, ...props }: ComponentProps<'a'> & ExtraProps) {
  const { origin } = useRouter();
  const rpc = use(rpcContext)?.rpc;
  const path = linkInternalPath(href, origin);
  const favicon = linkFaviconUrl(href);
  const host = linkHost(href);

  if (!href || href.startsWith('streamdown:')) {
    return <span className={cn(responseLinkClass, className)}>{children}</span>;
  }

  if (path) {
    const [to, hash] = path.split('#');

    return (
      <Link className={cn(responseLinkClass, className)} hash={hash} to={to}>
        {children}
      </Link>
    );
  }

  const anchor = (
    <a className={cn(responseLinkClass, className)} href={href} rel="noopener noreferrer" target="_blank" {...props}>
      {favicon ? <ResponseLinkFavicon className="mr-1" src={favicon} /> : null}
      {children}
    </a>
  );

  // Artifact embeds render without a daemon connection, so they show the favicon without a preview.
  if (!favicon || !host || !rpc) {
    return anchor;
  }

  return (
    <HoverCard closeDelay={100} openDelay={400}>
      <HoverCardTrigger asChild>{anchor}</HoverCardTrigger>
      <HoverCardContent className="w-80 p-3" collisionPadding={8}>
        <ResponseLinkPreview favicon={favicon} host={host} href={href} rpc={rpc} />
      </HoverCardContent>
    </HoverCard>
  );
}
