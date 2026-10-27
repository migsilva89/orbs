import { fileURLToPath } from 'node:url';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';
import Icons from 'unplugin-icons/vite';

export function createIconsPlugin() {
  return Icons({
    compiler: 'jsx',
    jsx: 'react',
    customCollections: {
      brands: FileSystemIconLoader(fileURLToPath(new URL('../../../packages/ui/src/assets/brands', import.meta.url))),
    },
  });
}
