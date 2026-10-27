import { createCn } from 'cn/config';

const tailwindMergeConfig = {
  extend: {
    classGroups: {
      'font-size': ['text-xxs'],
    },
  },
  override: {
    theme: {
      animate: ['spin', 'ping', 'pulse', 'bounce'],
    },
  },
};

export const cn = createCn(tailwindMergeConfig);
