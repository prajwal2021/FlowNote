import type { CreateTranslatedGuideResponse } from '@flownote/core/capture/ai/create-translated-guide';
import type { GenerateGuideDescriptionResponse } from '@flownote/core/capture/ai/guide-description';
import type { RewriteSelectionResponse } from '@flownote/core/capture/ai/rewrite';

interface TabLike {
  id?: number;
  url?: string;
  title?: string;
  windowId?: number;
  pendingUrl?: string;
}

export interface ShareMeta {
  title: string;
  kind: 'guide' | 'document' | 'video' | 'file';
  fileName: string;
}

export interface UiEnv {
  tabs: {
    create(url: string): Promise<TabLike | null>;
  };
  ai: {
    rewriteSelection(text: string, instruction: string): Promise<RewriteSelectionResponse>;
    describeGuide(guideId: string): Promise<GenerateGuideDescriptionResponse>;
    translateGuide?(guideId: string, language: string): Promise<CreateTranslatedGuideResponse>;
  };
  share?: {
    upload(blob: Blob, meta: ShareMeta): Promise<{ url: string }>;
  };
  appIconUrl?(id: string): string | null;
}

let current: UiEnv | null = null;

export function configureUi(env: UiEnv): void {
  current = env;
}

function env(): UiEnv {
  if (!current) throw new Error('@flownote/ui is not configured — call configureUi() at the surface entry point');
  return current;
}

export const tabs: UiEnv['tabs'] = {
  create: (url) => env().tabs.create(url),
};

export const ai: UiEnv['ai'] = {
  rewriteSelection: (text, instruction) => env().ai.rewriteSelection(text, instruction),
  describeGuide: (guideId) => env().ai.describeGuide(guideId),
};

export const translation = {
  available: (): boolean => Boolean(current?.ai.translateGuide),
  translate: (guideId: string, language: string): Promise<CreateTranslatedGuideResponse> => {
    if (!current?.ai.translateGuide) throw new Error('Guide translation is not available');
    return current.ai.translateGuide(guideId, language);
  },
};

export const appIcons = {
  url: (id: string): string | null => current?.appIconUrl?.(id) ?? null,
};

export const sharing = {
  available: (): boolean => Boolean(current?.share),
  upload: (blob: Blob, meta: ShareMeta) => {
    if (!current?.share) throw new Error('Sharing is not available');
    return current.share.upload(blob, meta);
  },
};
