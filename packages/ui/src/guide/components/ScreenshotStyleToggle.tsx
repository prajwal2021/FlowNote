import { i18n } from '@flownote/core/env';
import { SCREENSHOT_STYLES } from '@flownote/core/screenshot/screenshot-style';
import { OptionPills } from '../../common/components/OptionPills';
import { useScreenshotStyle } from '../../stores/use-screenshot-style';

export function ScreenshotStyleToggle() {
  const { style, setStyle } = useScreenshotStyle();
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      <span className="text-[12px] font-medium text-muted-foreground">{i18n.t('guide.screenshotView')}</span>
      <OptionPills
        label={i18n.t('guide.screenshotView')}
        value={style}
        onChange={setStyle}
        options={SCREENSHOT_STYLES.map((value) => ({ value, label: i18n.t(`guide.screenshotStyle_${value}`) }))}
      />
    </div>
  );
}
