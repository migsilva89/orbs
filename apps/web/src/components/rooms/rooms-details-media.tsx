import { m } from '@openbots/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { RoomsDetailsSection } from '@/components/rooms/rooms-details-section';
import { Empty, EmptyDescription, EmptyHeader, EmptyIcons, EmptyTitle } from '@/components/ui/empty';
import { FormErrors } from '@/components/ui/forms/form';
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttachmentUrl } from '@/hooks/use-attachment-url';
import { CHAT } from '@/services/chat/chat.constants';
import { ROOMS } from '@/services/rooms/rooms.constants';
import { rpc } from '@/services/rpc/rpc.client';
import IconFileText from '~icons/lucide/file-text';
import IconImages from '~icons/lucide/images';
import IconLayoutDashboard from '~icons/lucide/layout-dashboard';
import type { Attachment } from '@openbots/contracts/universal';

interface RoomsDetailsMediaProps {
  botId: string
}

export function RoomsDetailsMedia({ botId }: RoomsDetailsMediaProps) {
  const artifacts = useQuery(rpc.artifacts.listBot.queryOptions({ input: { botId } }));
  const files = useQuery(rpc.attachments.list.queryOptions({ input: { botId } }));
  const weekStart = files.dataUpdatedAt - ROOMS.mediaRecentMs;
  const items = files.data?.items ?? [];

  const sections = [
    { title: m.rooms_media_this_week(), files: items.filter((file) => file.createdAt >= weekStart) },
    { title: m.rooms_media_earlier(), files: items.filter((file) => file.createdAt < weekStart) },
  ].filter((section) => section.files.length > 0);

  if (files.isPending || artifacts.isPending) {
    return (
      <div className="flex flex-col gap-3 px-4 py-2">
        {[0, 1, 2].map((key) => <Skeleton className="h-8 w-full" key={key} />)}
      </div>
    );
  }

  if (sections.length === 0 && !artifacts.data?.length) {
    return (
      <Empty size="sm">
        <EmptyHeader>
          <EmptyIcons>
            <IconImages />
          </EmptyIcons>
          <EmptyTitle>{m.rooms_media_empty_title()}</EmptyTitle>
          <EmptyDescription>{m.rooms_media_empty_hint()}</EmptyDescription>
          <FormErrors error={files.isError || artifacts.isError ? m.rooms_media_error() : null} />
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-2">
      <FormErrors error={files.isError || artifacts.isError ? m.rooms_media_error() : null} />
      {artifacts.data && artifacts.data.length > 0 ? (
        <RoomsDetailsSection title={m.artifacts_title()}>
          <ItemGroup variant="outline">
            {artifacts.data.map((artifact) => (
              <Item key={artifact.id} size="sm">
                <Link
                  className="flex min-w-0 flex-1 items-center gap-2.5"
                  params={{ botId, conversationId: artifact.conversationId, artifactId: artifact.id }}
                  title={artifact.title}
                  to="/artifacts/$botId/$conversationId/$artifactId"
                >
                  <ItemMedia variant="icon"><IconLayoutDashboard /></ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="w-full"><span className="truncate">{artifact.title}</span></ItemTitle>
                  </ItemContent>
                </Link>
              </Item>
            ))}
          </ItemGroup>
        </RoomsDetailsSection>
      ) : null}
      {sections.map((section) => (
        <RoomsDetailsSection key={section.title} title={section.title}>
          <ItemGroup variant="outline">
            {section.files.map((file) => (
              <RoomsDetailsMediaItem
                botId={botId}
                file={file}
                key={file.id}
              />
            ))}
          </ItemGroup>
        </RoomsDetailsSection>
      ))}
    </div>
  );
}

interface RoomsDetailsMediaItemProps {
  botId: string
  file: Attachment
}

function RoomsDetailsMediaItem({ botId, file }: RoomsDetailsMediaItemProps) {
  const image = file.mediaType.startsWith('image/');
  const url = useAttachmentUrl(botId, `${CHAT.attachmentScheme}${file.id}`);

  const thumbnail = image ? (
    <img
      alt=""
      loading="lazy"
      src={url}
    />
  ) : <IconFileText />;

  return (
    <Item size="sm">
      <a
        className="flex min-w-0 flex-1 items-center gap-2.5"
        download={image ? undefined : file.name}
        href={url}
        rel="noreferrer"
        target={image ? '_blank' : undefined}
        title={file.name}
      >
        <ItemMedia variant={image ? 'image' : 'icon'}>
          {thumbnail}
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle className="w-full">
            <span className="truncate">{file.name}</span>
          </ItemTitle>
        </ItemContent>
      </a>
    </Item>
  );
}
