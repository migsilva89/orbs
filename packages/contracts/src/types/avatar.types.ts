import { z } from 'zod';

export const AVATAR = {
  maxBytes: 8 * 1024 * 1024,
  mediaTypes: ['image/png', 'image/jpeg', 'image/webp'],
  size: 512,
  notificationSize: 256,
  pathPrefix: '/avatars/',
} as const;

export const avatarImageId = z.uuid();

export const avatarUpload = z.object({
  file: z.file().min(1).max(AVATAR.maxBytes).refine((file) => (
    AVATAR.mediaTypes.some((mediaType) => mediaType === file.type.split(';', 1)[0]?.trim())
  )),
});

export type AvatarUploadInput = z.infer<typeof avatarUpload>;
