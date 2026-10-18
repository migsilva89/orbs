import { createRegistry } from '@earendil-works/pi-durable';
import { Errors } from '@openbots/errors/universal';
import { match } from 'ts-pattern';
import type { Extension, Registry } from '@earendil-works/pi-durable';

export function runtimePluginsInstall(registry: Registry, plugins: Extension[]) {
  const preview = createRegistry();

  for (const installed of registry.snapshot().installed()) {
    preview.install(installed);
  }

  for (const plugin of plugins) {
    const installed = preview.snapshot().extension(plugin.name);
    match(plugin.name.startsWith('openbots.') || (installed !== undefined && installed !== plugin))
      .with(true, () => {
        throw new Errors.VALIDATION_ERROR({ fields: {
          plugins: { message: 'A plugin name conflicts with an installed extension.' },
        } });
      })
      .with(false, () => preview.install(plugin))
      .exhaustive();
  }

  for (const plugin of plugins) {
    registry.install(plugin);
  }
}
