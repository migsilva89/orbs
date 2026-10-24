import { BotEngine } from '@repo/avatar-blobs/engine';
import { DEFAULT_EXPRESSION, EXPRESSION_BY_ID } from '@repo/avatar-blobs/expressions';
import { avatarMarkup, avatarStill, avatarSvg } from '@repo/avatar-blobs/player';
import { BODY_BY_ID, COLOR_BY_ID, DEFAULT_BODY, DEFAULT_COLOR, INVERT_ON_DARK, INVERT_ON_LIGHT } from '@repo/avatar-blobs/skins';
import { HALF_VIEWBOX, RADIUS } from '@repo/avatar-blobs/viewbox';
import { cva } from 'cva';
import { useId } from 'react';
import { Image, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { match } from 'ts-pattern';
import { useUniwind } from 'uniwind';
import { useAvatarClock } from '@/hooks/use-avatar-clock';
import { useConnection } from '@/hooks/use-connection';
import { cn } from '@/lib/cn';
import { connectionAvatarUri } from '@/services/connection/connection.client';
import { Text } from './text';
import type { Bot } from '@repo/contracts/universal';
import type { VariantProps } from 'cva';

// The blob art leaves padding inside its viewbox; zooming in lets it fill the avatar circle.
const BLOB_ZOOM = 0.72;
const BLOB_HALF = HALF_VIEWBOX * BLOB_ZOOM;

const avatarVariants = cva({
  base: 'shrink-0 items-center justify-center overflow-hidden rounded-full',
  variants: { size: { xs: 'size-4', sm: 'size-8', default: 'size-12', featured: 'size-24' } },
  defaultVariants: { size: 'default' },
});

interface AvatarProps extends Pick<Bot, 'avatar' | 'name'>, VariantProps<typeof avatarVariants> {
  animate?: boolean;
  className?: string;
}

export function Avatar({ avatar, name, size = 'default', animate = false, className }: AvatarProps) {
  const { theme } = useUniwind();
  const { session } = useConnection();
  const uid = `avatar-${useId().replaceAll(/[^\w-]/g, '')}`;
  const look = match(avatar).with({ kind: 'blob' }, (value) => value).otherwise(() => ({ body: DEFAULT_BODY, color: DEFAULT_COLOR, expression: DEFAULT_EXPRESSION }));
  const inverted = match(theme).with('dark', () => INVERT_ON_DARK.includes(look.color)).otherwise(() => INVERT_ON_LIGHT.includes(look.color));

  const radii = BODY_BY_ID.get(look.body)?.radii ?? null;
  const expression = EXPRESSION_BY_ID.get(look.expression) ?? null;
  const clock = useAvatarClock(animate && (avatar === null || avatar.kind === 'blob'));

  const frame = match(clock)
    .with(null, () => avatarStill({
      state: 'idle',
      radii,
      expression,
    }))
    .otherwise((seconds) => new BotEngine(RADIUS, 'idle', radii, expression).sample(seconds));

  const nodes = avatarSvg(frame, COLOR_BY_ID.get(look.color)?.hex ?? '#0a0a0c', uid).map(avatarMarkup).join('');

  const art = match(inverted)
    .with(true, () => `<defs><filter id="${uid}-invert"><feColorMatrix type="matrix" values="-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0"/></filter></defs><g filter="url(#${uid}-invert)">${nodes}</g>`)
    .with(false, () => nodes)
    .exhaustive();

  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-BLOB_HALF} ${-BLOB_HALF} ${BLOB_HALF * 2} ${BLOB_HALF * 2}">${art}</svg>`;

  return (
    <View accessible accessibilityLabel={name} className={cn(avatarVariants({ size }), className)}>
      {match(avatar)
        .with({ kind: 'image' }, ({ src }) => <Image className="size-full" resizeMode="cover" source={{ uri: connectionAvatarUri({ session, src }) }} />)
        .with({ kind: 'color' }, ({ color }) => <View className="size-full" style={{ backgroundColor: color }} />)
        .with({ kind: 'emoji' }, ({ emoji, color }) => (
          <View className="size-full items-center justify-center" style={{ backgroundColor: color }}>
            <Text variant={match(size).with('featured', () => 'avatar-featured' as const).with('sm', 'xs', () => 'avatar-small' as const).otherwise(() => 'avatar' as const)}>{emoji}</Text>
          </View>
        ))
        .otherwise(() => <SvgXml height="100%" width="100%" xml={xml} />)}
    </View>
  );
}
