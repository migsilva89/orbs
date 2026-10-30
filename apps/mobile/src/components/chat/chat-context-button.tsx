import { useChatContextUsage } from '@repo/client/react';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface ChatContextButtonProps {
  botId: string;
  conversationId: number;
  latestEntryId: number;
  isBusy: boolean;
}

export function ChatContextButton({ botId, conversationId, latestEntryId, isBusy }: ChatContextButtonProps) {
  const router = useRouter();
  const [muted, warning] = useCSSVariable(['--color-muted-foreground', '--color-warning']).map(String);

  const usage = useChatContextUsage({
    botId,
    conversationId,
    revision: isBusy ? undefined : latestEntryId,
  });

  if (!usage.context) {
    return null;
  }

  const { percent, shown, used, label, isNearFull } = usage.context;
  const color = isNearFull ? warning : muted;
  const circumference = 2 * Math.PI * 6;

  return (
    <Button
      accessibilityLabel={label}
      className="gap-1.5"
      size={percent === null || isNearFull ? 'xs' : 'icon-sm'}
      variant="ghost"
      onPress={() => router.push({ pathname: '/chat/[botId]/context', params: { botId, conversationId: String(conversationId) } })}
    >
      {percent === null ? null : (
        <Svg
          height={16}
          style={{ transform: [{ rotate: '-90deg' }] }}
          viewBox="0 0 16 16"
          width={16}
        >
          <Circle
            cx={8}
            cy={8}
            fill="none"
            opacity={0.25}
            r={6}
            stroke={color}
            strokeWidth={2}
          />
          <Circle
            cx={8}
            cy={8}
            fill="none"
            r={6}
            stroke={color}
            strokeDasharray={`${(percent / 100) * circumference} ${circumference}`}
            strokeLinecap="round"
            strokeWidth={2}
          />
        </Svg>
      )}
      {percent === null || isNearFull ? (
        <Text tone={isNearFull ? 'warning' : 'muted'} variant="caption">{percent === null ? `~${used}` : shown}</Text>
      ) : null}
    </Button>
  );
}
