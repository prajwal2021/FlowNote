import { generateDescriptionOnDemand } from '@flownote/core/capture/ai/guide-description';
import { rewriteSelection } from '@flownote/core/capture/ai/rewrite';
import { configureUi } from '@flownote/ui/env';

configureUi({
  tabs: {
    create: async (url) => {
      window.open(url, '_blank');
      return null;
    },
  },
  ai: {
    rewriteSelection,
    describeGuide: generateDescriptionOnDemand,
  },
  appIconUrl: (id) =>
    /^([/\\]|[A-Za-z]:)/.test(id) ? `flownote-app-icon://icon/?path=${encodeURIComponent(id)}` : null,
});
