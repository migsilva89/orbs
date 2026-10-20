import { htmlReplyContent } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { useContext, useState } from 'react';
import { Block, StreamdownContext } from 'streamdown';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HtmlFrame } from '@/components/ui/html-frame';
import IconCode from '~icons/lucide/code';
import IconMaximize from '~icons/lucide/maximize-2';
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

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border" data-message-wide>
      <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5">
        <span className="text-xs text-muted-foreground">{m.ui_html_preview()}</span>
        <div className="flex items-center gap-1">
          <Button aria-pressed={source} size="xs" variant="ghost" onClick={() => setSource(!source)}>
            <IconCode />
            {m.ui_html_source()}
          </Button>
          <Button aria-label={m.artifacts_expand()} size="icon-xs" variant="ghost" onClick={() => setExpanded(true)}>
            <IconMaximize />
          </Button>
        </div>
      </div>
      {source ? (
        <pre className="max-h-96 overflow-auto p-3 text-xs"><code>{html}</code></pre>
      ) : (
        <HtmlFrame html={html} title={m.ui_html_preview()} />
      )}
      {expanded ? (
        <Dialog open onOpenChange={setExpanded}>
          <DialogContent aria-describedby={undefined} className="flex h-[min(86svh,calc(100svh-10rem))] w-[92vw] max-w-[92vw] flex-col">
            <DialogHeader><DialogTitle>{m.ui_html_preview()}</DialogTitle></DialogHeader>
            <div className="min-h-0 flex-1 overflow-auto">
              <HtmlFrame html={html} title={m.ui_html_preview()} />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
