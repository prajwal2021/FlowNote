import { configureUi } from '@flownote/ui/env';
import { uploadShare } from '@/lib/auth/upload-share';
import { createTab } from '@/lib/browser-api/create-tab';
import { sendMessage } from '@/lib/messaging';

configureUi({
  share: { upload: uploadShare },
  tabs: {
    create: (url) => createTab({ url }) as never,
  },
  ai: {
    rewriteSelection: (text, instruction) => sendMessage('rewriteSelection', { text, instruction }),
    describeGuide: (guideId) => sendMessage('generateGuideDescription', { guideId }),
    translateGuide: (guideId, language) => sendMessage('translateGuide', { guideId, language }),
  },
});
