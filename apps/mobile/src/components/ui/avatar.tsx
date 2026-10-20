import { DEFAULT_EXPRESSION, EXPRESSION_BY_ID } from '@openbots/avatar-blobs/expressions';
import { avatarStill, avatarSvg } from '@openbots/avatar-blobs/player';
import { BODY_BY_ID, COLOR_BY_ID, DEFAULT_BODY, DEFAULT_COLOR, INVERT_ON_DARK, INVERT_ON_LIGHT } from '@openbots/avatar-blobs/skins';
import { HALF_VIEWBOX } from '@openbots/avatar-blobs/viewbox';
import { cva } from 'cva';
import { useId } from 'react';
import { Image, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { match } from 'ts-pattern';
import { useUniwind } from 'uniwind';
import { cn } from '@/lib/cn';
import { Text } from './text';
import type { AvatarSvgNode } from '@openbots/avatar-blobs/player';
import type { Bot } from '@openbots/contracts/universal';
import type { VariantProps } from 'cva';

// The blob art leaves padding inside its viewbox; zooming in lets it fill the avatar circle.
const BLOB_ZOOM = 0.72;
const BLOB_HALF = HALF_VIEWBOX * BLOB_ZOOM;

const avatarVariants = cva({
  base: 'shrink-0 items-center justify-center overflow-hidden rounded-full',
  variants: { size: { default: 'size-12', featured: 'size-24' } },
  defaultVariants: { size: 'default' },
});

interface AvatarProps extends Pick<Bot, 'avatar' | 'name'>, VariantProps<typeof avatarVariants> {
  className?: string;
}

function avatarMarkup(node: AvatarSvgNode): string {
  const attrs = Object.entries(node.attrs).map(([key, value]) => `${key}="${value}"`).join(' ');
  return `<${node.tag} ${attrs}>${node.children.map(avatarMarkup).join('')}</${node.tag}>`;
}

export function Avatar({ avatar, name, size = 'default', className }: AvatarProps) {
  const { theme } = useUniwind();
  const uid = `avatar-${useId().replaceAll(/[^\w-]/g, '')}`;
  const look = match(avatar).with({ kind: 'blob' }, (value) => value).otherwise(() => ({ body: DEFAULT_BODY, color: DEFAULT_COLOR, expression: DEFAULT_EXPRESSION }));
  const inverted = match(theme).with('dark', () => INVERT_ON_DARK.includes(look.color)).otherwise(() => INVERT_ON_LIGHT.includes(look.color));

  const frame = avatarStill({
    state: 'idle',
    radii: BODY_BY_ID.get(look.body)?.radii ?? null,
    expression: EXPRESSION_BY_ID.get(look.expression) ?? null,
  });

  const nodes = avatarSvg(frame, COLOR_BY_ID.get(look.color)?.hex ?? '#0a0a0c', uid).map(avatarMarkup).join('');

  const art = match(inverted)
    .with(true, () => `<defs><filter id="${uid}-invert"><feColorMatrix type="matrix" values="-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0"/></filter></defs><g filter="url(#${uid}-invert)">${nodes}</g>`)
    .with(false, () => nodes)
    .exhaustive();

  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-BLOB_HALF} ${-BLOB_HALF} ${BLOB_HALF * 2} ${BLOB_HALF * 2}">${art}</svg>`;

  return (
    <View accessible accessibilityLabel={name} className={cn(avatarVariants({ size }), className)}>
      {match(avatar)
        .with({ kind: 'image' }, ({ src }) => <Image className="size-full" resizeMode="cover" source={{ uri: src }} />)
        .with({ kind: 'color' }, ({ color }) => <View className="size-full" style={{ backgroundColor: color }} />)
        .with({ kind: 'emoji' }, ({ emoji, color }) => (
          <View className="size-full items-center justify-center" style={{ backgroundColor: color }}>
            <Text variant={match(size).with('featured', () => 'avatar-featured' as const).otherwise(() => 'avatar' as const)}>{emoji}</Text>
          </View>
        ))
        .otherwise(() => <SvgXml height="100%" width="100%" xml={xml} />)}
    </View>
  );
}
