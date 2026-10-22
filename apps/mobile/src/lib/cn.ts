import { createCn } from 'cn/config';

const tailwindMergeConfig = {
  extend: {
    classGroups: {
      'font-size': ['text-caption', 'text-footnote', 'text-subhead', 'text-body', 'text-title', 'text-display'],
    },
  },
  override: {
    theme: {
      animate: ['spin', 'ping', 'pulse', 'bounce'],
    },
  },
};

export const cn = createCn(tailwindMergeConfig);
