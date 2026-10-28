import { z } from 'zod';

const LINK_PRIVATE_HOST = /^(localhost|[^.]+)$|\.(local|localhost|internal|lan|home|ts\.net)$/;
const LINK_IP_HOST = /^\[.*\]$|^\d+(\.\d+){3}$/;

export const linkUrl = z.url({ protocol: /^https?$/ }).max(2048).refine((value) => {
  const { hostname, username, password } = new URL(value);

  return !username && !password && !LINK_IP_HOST.test(hostname) && !LINK_PRIVATE_HOST.test(hostname);
});

export const linkPreviewInput = z.object({ url: linkUrl });

export const linkPreview = z.object({
  url: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  siteName: z.string().nullable(),
});

export type LinkPreviewInput = z.infer<typeof linkPreviewInput>;
export type LinkPreview = z.infer<typeof linkPreview>;
