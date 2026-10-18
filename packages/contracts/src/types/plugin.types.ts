import { z } from 'zod';

export const pluginSettings = z.object({
  directories: z.array(z.string().trim().min(1).max(4096)).max(50),
});

export const pluginConfigure = pluginSettings.partial();
export const pluginDiscover = z.object({ botId: z.uuid() });

export const pluginCatalog = z.object({
  plugins: z.array(z.object({ name: z.string(), path: z.string() })),
  diagnostics: z.array(z.object({ path: z.string(), message: z.string() })),
});

export type PluginSettings = z.infer<typeof pluginSettings>;
export type PluginConfigureInput = z.infer<typeof pluginConfigure>;
export type PluginCatalog = z.infer<typeof pluginCatalog>;
