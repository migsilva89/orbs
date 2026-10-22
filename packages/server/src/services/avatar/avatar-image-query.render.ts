import { DEFAULT_EXPRESSION, EXPRESSION_BY_ID } from '@repo/avatar-blobs/expressions';
import { avatarMarkup, avatarStill, avatarSvg } from '@repo/avatar-blobs/player';
import { BODY_BY_ID, COLOR_BY_ID, DEFAULT_BODY, DEFAULT_COLOR } from '@repo/avatar-blobs/skins';
import { HALF_VIEWBOX } from '@repo/avatar-blobs/viewbox';
import { render } from 'takumi-js';
import { container, image, text } from 'takumi-js/helpers';
import { match, P } from 'ts-pattern';
import { avatarImageQueryRead } from './avatar-image-query.read';
import { AVATAR_IMAGE } from './avatar.constants';
import { avatarImageIdFromSrc } from './avatar.utils';
import type { AvatarImageDeps, AvatarImageRenderParams } from '../../types/avatar.types';

export async function avatarImageQueryRender(deps: AvatarImageDeps, { avatar, size }: AvatarImageRenderParams) {
  const circle = { width: size, height: size, borderRadius: size / 2, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' } as const;
  const picture = image({ src: 'avatar', style: { width: '100%', height: '100%' } });

  const { node, data } = await match(avatar)
    .with({ kind: 'image' }, async ({ src }) => ({
      node: container({ style: circle, children: [picture] }),
      data: await avatarImageQueryRead(deps, { imageId: avatarImageIdFromSrc(src) }),
    }))
    .with({ kind: 'color' }, ({ color }) => ({ node: container({ style: { ...circle, backgroundColor: color } }), data: null }))
    .with({ kind: 'emoji' }, ({ emoji, color }) => ({
      node: container({ style: { ...circle, backgroundColor: color }, children: [text(emoji, { fontSize: size * 0.55 })] }),
      data: null,
    }))
    .with(P.union({ kind: 'blob' }, null), (blob) => {
      const half = HALF_VIEWBOX * AVATAR_IMAGE.blobZoom;

      const frame = avatarStill({
        state: 'idle',
        radii: BODY_BY_ID.get(blob?.body ?? DEFAULT_BODY)?.radii ?? null,
        expression: EXPRESSION_BY_ID.get(blob?.expression ?? DEFAULT_EXPRESSION) ?? null,
      });

      const ink = COLOR_BY_ID.get(blob?.color ?? DEFAULT_COLOR)?.hex ?? AVATAR_IMAGE.blobInk;
      const nodes = avatarSvg(frame, ink, 'avatar').map(avatarMarkup).join('');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-half} ${-half} ${half * 2} ${half * 2}">${nodes}</svg>`;

      return {
        node: container({ style: { ...circle, backgroundColor: AVATAR_IMAGE.blobBackground }, children: [picture] }),
        data: new TextEncoder().encode(svg),
      };
    })
    .exhaustive();

  return render(node, {
    width: size,
    height: size,
    format: 'png',
    images: data ? [{ src: 'avatar', data }] : [],
  });
}

