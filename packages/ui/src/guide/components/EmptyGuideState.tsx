import { i18n } from '@flownote/core/env';
import { BrandBadge } from '../../common/components/BrandBadge';

export function EmptyGuideState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[300px]">
      <div className="relative">
        <BrandBadge size={72} />
        <div className="absolute -top-2 -right-3 flex gap-0.5 text-muted-foreground/40">
          <span className="text-sm animate-pulse">z</span>
          <span className="text-xs animate-pulse [animation-delay:400ms]">z</span>
          <span className="text-[10px] animate-pulse [animation-delay:800ms]">z</span>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground mt-5">{i18n.t('emptyGuide.title')}</p>
      <p className="text-xs text-muted-foreground mt-1">{i18n.t('emptyGuide.subtitle')}</p>
    </div>
  );
}
