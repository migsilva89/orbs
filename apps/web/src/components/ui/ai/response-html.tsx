import { htmlEmoji, htmlReplyContent, htmlTitle } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useContext, useState } from 'react';
import { Block, StreamdownContext } from 'streamdown';
import { HtmlFrame } from '@/components/ui/html-frame';
import { Pane, PaneBody, PaneContent, PaneHeader, PaneTitle } from '@/components/ui/pane';
import { PreviewCard } from '@/components/ui/preview-card';
import type { BlockProps } from 'streamdown';

export function ResponseHtml(props: BlockProps) {
  const { isAnimating } = useContext(StreamdownContext);
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
        content="page"
        icon={htmlEmoji(html)}
        kind={m.ui_html_page()}
        label={m.artifacts_expand()}
        title={title}
        onOpen={() => setExpanded(true)}
      >
        <HtmlFrame html={html} title={title} />
      </PreviewCard>
      {expanded ? (
        <Pane open onOpenChange={setExpanded}>
          <PaneContent>
            <PaneHeader>
              <PaneTitle icon={htmlEmoji(html)}>{title}</PaneTitle>
            </PaneHeader>
            <PaneBody size="full">
              <HtmlFrame html={html} title={title} />
            </PaneBody>
          </PaneContent>
        </Pane>
      ) : null}
    </>
  );
}
