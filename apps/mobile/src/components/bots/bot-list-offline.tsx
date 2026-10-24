import { DEFAULT_BODY, DEFAULT_COLOR } from '@repo/avatar-blobs/skins';
import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { ChatTyping } from '@/components/chat/chat-typing';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';

interface BotListOfflineProps {
  host: string;
  isRetrying: boolean;
  onRetry: () => void;
}

export function BotListOffline({ host, isRetrying, onRetry }: BotListOfflineProps) {
  const router = useRouter();

  return (
    <Empty className="flex-1 justify-center">
      <EmptyHeader>
        <Avatar
          animate
          avatar={{
            kind: 'blob',
            body: DEFAULT_BODY,
            color: DEFAULT_COLOR,
            expression: 'sad',
          }}
          name={m.mobile_bots_unreachable_title()}
          size="featured"
        />
        <EmptyTitle>{m.mobile_bots_unreachable_title()}</EmptyTitle>
        <EmptyDescription>{m.mobile_bots_unreachable({ host })}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {isRetrying
          ? <ChatTyping accessibilityLabel={m.mobile_bots_reconnecting()} label={m.mobile_bots_reconnecting()} />
          : <Button onPress={onRetry}>{m.mobile_retry()}</Button>}
        <Button
          variant="ghost"
          onPress={() => router.push('/settings/server/address')}
        >
          {m.mobile_bots_edit_address()}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
