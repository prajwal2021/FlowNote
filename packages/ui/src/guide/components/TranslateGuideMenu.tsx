import { TRANSLATION_LANGUAGES } from '@flownote/core/capture/ai/translation-languages';
import { i18n } from '@flownote/core/env';
import { Languages, Loader2 } from 'lucide-react';
import { AiFailureNotice } from '../../ai/components/AiFailureNotice';
import { Notice } from '../../common/components/Notice';
import { Toast } from '../../common/components/Toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { useTranslateGuide } from '../hooks/use-translate-guide';

export function TranslateGuideMenu({ guideId }: { guideId: string }) {
  const translate = useTranslateGuide(guideId);
  if (!translate.available) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={translate.running}
          aria-label={i18n.t('translate.action')}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-card border border-border px-2.5 py-0.5 rounded-full hover:text-accent hover:border-accent transition-colors disabled:cursor-not-allowed disabled:hover:text-muted-foreground disabled:hover:border-border"
        >
          {translate.running ? <Loader2 size={11} className="animate-spin text-accent" /> : <Languages size={11} />}
          {translate.running ? i18n.t('translate.running') : i18n.t('translate.action')}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
          {TRANSLATION_LANGUAGES.map((language) => (
            <DropdownMenuItem key={language.code} onSelect={() => void translate.translate(language.name)}>
              {language.native}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {translate.failure && (
        <div className="basis-full">
          <AiFailureNotice failure={translate.failure} />
        </div>
      )}
      <Toast message={translate.error} onDismiss={translate.dismiss} />
      <Notice title={translate.done} onDismiss={translate.dismiss} />
    </>
  );
}
