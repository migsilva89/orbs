import { ROOMS } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { FileText, Images, LayoutDashboard } from 'lucide-react-native';
import { Image, View } from 'react-native';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { Empty } from '@/components/ui/empty';
import { Icon } from '@/components/ui/icon';
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Text } from '@/components/ui/text';
import { connectionFileSource } from '@/services/connection/connection.client';
import type { RpcSession } from '@/types/rpc.types';
import type { Attachment } from '@openbots/contracts/universal';

interface BotDetailsMediaProps {
  session: RpcSession;
  botId: string;
}

export function BotDetailsMedia({ session, botId }: BotDetailsMediaProps) {
  const artifacts = useQuery(session.rpc.artifacts.listBot.queryOptions({ input: { botId } }));
  const files = useQuery(session.rpc.attachments.list.queryOptions({ input: { botId } }));
  const weekStart = files.dataUpdatedAt - ROOMS.mediaRecentMs;
  const items = files.data?.items ?? [];
  const isError = files.isError || artifacts.isError;

  const sections = [
    { title: m.rooms_media_this_week(), files: items.filter((file) => file.createdAt >= weekStart) },
    { title: m.rooms_media_earlier(), files: items.filter((file) => file.createdAt < weekStart) },
  ].filter((section) => section.files.length > 0);

  if (files.isPending || artifacts.isPending) {
    return null;
  }

  if (sections.length === 0 && !artifacts.data?.length) {
    return (
      <Empty
        description={m.rooms_media_empty_hint()}
        icon={(
          <Icon
            icon={Images}
            size="lg"
            tone="muted"
          />
        )}
        size="sm"
        title={m.rooms_media_empty_title()}
      >
        {isError ? <Text variant="error">{m.rooms_media_error()}</Text> : null}
      </Empty>
    );
  }

  return (
    <View className="gap-4">
      {isError ? <Text variant="error">{m.rooms_media_error()}</Text> : null}
      {artifacts.data && artifacts.data.length > 0 ? (
        <BotDetailsSection title={m.artifacts_title()}>
          <ItemGroup>
            {artifacts.data.map((artifact) => (
              <Item key={artifact.id} size="sm">
                <ItemMedia>
                  <Icon icon={LayoutDashboard} tone="muted" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle numberOfLines={1}>{artifact.title}</ItemTitle>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </BotDetailsSection>
      ) : null}
      {sections.map((section) => (
        <BotDetailsSection key={section.title} title={section.title}>
          <ItemGroup>
            {section.files.map((file) => (
              <BotDetailsMediaItem
                botId={botId}
                file={file}
                key={file.id}
                session={session}
              />
            ))}
          </ItemGroup>
        </BotDetailsSection>
      ))}
    </View>
  );
}

interface BotDetailsMediaItemProps {
  session: RpcSession;
  botId: string;
  file: Attachment;
}

function BotDetailsMediaItem({ session, botId, file }: BotDetailsMediaItemProps) {
  const isImage = file.mediaType.startsWith('image/');

  return (
    <Item size="sm">
      {isImage ? (
        <ItemMedia variant="image">
          <Image
            className="size-full"
            resizeMode="cover"
            source={connectionFileSource(session.connection, { botId, attachmentId: file.id })}
          />
        </ItemMedia>
      ) : (
        <ItemMedia variant="icon">
          <Icon icon={FileText} tone="muted" />
        </ItemMedia>
      )}
      <ItemContent>
        <ItemTitle numberOfLines={1}>{file.name}</ItemTitle>
      </ItemContent>
    </Item>
  );
}
