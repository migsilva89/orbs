import { htmlReplyContent, htmlTitle } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useContext, useState } from 'react';
import { Block, StreamdownContext } from 'streamdown';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HtmlFrame } from '@/components/ui/html-frame';
import { PreviewCard } from '@/components/ui/preview-card';
import IconCode from '~icons/lucide/code';
import type { BlockProps } from 'streamdown';

export function ResponseHtml(props: BlockProps) {
  const { isAnimating } = useContext(StreamdownContext);
  const [source, setSource] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const html = htmlReplyContent(props.content);

  // Do not execute a document while the model is still writing it.
  if (html === undefined || isAnimating) {
    return <Block {...props} />;
  }

  const title = htmlTitle(html) ?? m.ui_html_preview();

  return (
    <>
      <PreviewCard
        icon={<IconCode />}
        kind={m.ui_html_page()}
        label={m.artifacts_expand()}
        title={title}
        onOpen={() => setExpanded(true)}
      >
        <HtmlFrame html={html} title={title} />
      </PreviewCard>
      {expanded ? (
        <Dialog open onOpenChange={setExpanded}>
          <DialogContent aria-describedby={undefined} className="flex h-[min(86svh,calc(100svh-10rem))] w-[92vw] max-w-[92vw] flex-col">
            <DialogHeader className="flex-row items-center justify-between gap-2">
              <DialogTitle className="truncate">{title}</DialogTitle>
              <Button aria-pressed={source} size="xs" variant="ghost" onClick={() => setSource(!source)}>
                <IconCode />
                {m.ui_html_source()}
              </Button>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-auto">
              {source ? <pre className="p-3 text-xs"><code>{html}</code></pre> : <HtmlFrame html={html} title={title} />}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
