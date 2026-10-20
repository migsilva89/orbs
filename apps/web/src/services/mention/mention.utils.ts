import { mentionHandle, mentionHref, mentionTarget } from '@openbots/client/client';
import { visit } from 'unist-util-visit';
import type { MentionRemarkParams } from '@/types/mention.types';
import type { Root, Text } from 'mdast';

export function mentionRemark({ bots }: MentionRemarkParams) {
  function mentionElement(href: string, label: string): Text {
    return { type: 'text', value: label, data: { hName: 'mention', hProperties: { dataHref: href, dataLabel: label } } };
  }

  const hrefs = new Map(bots.map((bot) => [bot.handle, mentionHref({ kind: 'bot', name: bot.id })]));
  const handles = new RegExp(mentionHandle(`(?:${[...hrefs.keys()].join('|')})`).source, 'giu');

  return () => (tree: Root) => {
    visit(tree, 'link', (node, index, parent) => {
      if (index === undefined || !parent || !mentionTarget({ href: node.url })) {
        return;
      }

      parent.children.splice(index, 1, mentionElement(node.url, node.children.map((child) => (child.type === 'text' ? child.value : '')).join('')));
    });

    if (hrefs.size === 0) {
      return;
    }

    visit(tree, 'text', (node: Text, index, parent) => {
      if (index === undefined || !parent || node.data?.hName) {
        return;
      }

      const nodes: Text[] = [];
      let last = 0;

      for (const match of node.value.matchAll(handles)) {
        const href = hrefs.get(match[0].slice(1).toLowerCase());

        if (href) {
          nodes.push({ type: 'text', value: node.value.slice(last, match.index) }, mentionElement(href, match[0]));
          last = match.index + match[0].length;
        }
      }

      if (last === 0) {
        return;
      }

      nodes.push({ type: 'text', value: node.value.slice(last) });
      parent.children.splice(index, 1, ...nodes);

      return index + nodes.length;
    });
  };
}
