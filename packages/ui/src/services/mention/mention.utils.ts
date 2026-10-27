import { mentionTarget } from '@repo/client/client';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

export function mentionRemark() {
  return () => (tree: Root) => {
    visit(tree, 'link', (node, index, parent) => {
      if (index === undefined || !parent || !mentionTarget({ href: node.url })) {
        return;
      }

      const label = node.children.map((child) => (child.type === 'text' ? child.value : '')).join('');

      parent.children.splice(index, 1, {
        type: 'text',
        value: label,
        data: { hName: 'mention', hProperties: { dataHref: node.url, dataLabel: label } },
      });
    });
  };
}
