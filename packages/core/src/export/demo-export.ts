import { i18n } from '@/core/env';
import { fitLogo, loadBranding } from '@/core/export/branding';
import { type ExportOptions, loadExportOptions } from '@/core/export/options';
import { POPPINS_FONT_FACES } from '@/core/export/poppins';
import { blobToBase64, escapeHtml } from '@/core/export/utils';
import { isBlock, stepNumbers } from '@/core/guides/blocks';
import type { Guide, Screenshot, Step } from '@/core/guides/types';
import { resolveViewport } from '@/core/screenshot/geometry';
import { renderScreenshot } from '@/core/screenshot/render';

const LOGO_MAX_WIDTH = 120;
const LOGO_MAX_HEIGHT = 44;

interface Hotspot {
  left: number;
  top: number;
}

function hotspotPosition(screenshot: Screenshot): Hotspot | null {
  const click = screenshot.clickPoint;
  if (!click) return null;

  const viewport = resolveViewport(screenshot);
  if (!viewport.width || !viewport.height) return null;

  const ratio = screenshot.pixelRatio || 1;
  const left = ((click.x * ratio - viewport.x) / viewport.width) * 100;
  const top = ((click.y * ratio - viewport.y) / viewport.height) * 100;
  if (!Number.isFinite(left) || !Number.isFinite(top)) return null;
  if (left < 0 || left > 100 || top < 0 || top > 100) return null;

  return { left: Math.round(left * 100) / 100, top: Math.round(top * 100) / 100 };
}

async function stageHtml(screenshot: Screenshot, altText: string): Promise<string> {
  const rendered = await renderScreenshot(screenshot);
  const b64 = await blobToBase64(rendered);
  const hotspot = hotspotPosition(screenshot);
  const marker = hotspot
    ? `<button type="button" data-hotspot="true" class="hotspot" style="left:${hotspot.left}%;top:${hotspot.top}%;" aria-label="${escapeHtml(i18n.t('demo.hotspot'))}"><span class="ring"></span><span class="dot"></span></button>`
    : '';
  return `<div class="shot"><img src="data:${rendered.type};base64,${b64}" alt="${escapeHtml(altText)}" />${marker}</div>`;
}

const DEMO_SCRIPT = `(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-slide]'));
  if (!slides.length) return;
  var bar = document.getElementById('fn-bar');
  var counter = document.getElementById('fn-counter');
  var back = document.getElementById('fn-back');
  var next = document.getElementById('fn-next');
  var index = 0;
  function show(target) {
    index = Math.max(0, Math.min(slides.length - 1, target));
    for (var i = 0; i < slides.length; i++) slides[i].hidden = i !== index;
    bar.style.width = ((index + 1) / slides.length) * 100 + '%';
    counter.textContent = slides[index].getAttribute('data-counter') || '';
    back.disabled = index === 0;
    next.disabled = index === slides.length - 1;
  }
  back.addEventListener('click', function () { show(index - 1); });
  next.addEventListener('click', function () { show(index + 1); });
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (target && target.closest && target.closest('[data-hotspot]')) show(index + 1);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); show(index + 1); }
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); show(index - 1); }
  });
  show(0);
})();`;

const DEMO_STYLE = `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Poppins', sans-serif; background: #0B1020; color: #F8FAFC; min-height: 100vh; display: flex; flex-direction: column; }
header { display: flex; align-items: center; gap: 16px; padding: 18px 24px; }
header h1 { font-size: 17px; font-weight: 700; flex: 1; min-width: 0; }
.track { height: 4px; background: rgba(248, 250, 252, 0.14); }
.track span { display: block; height: 100%; width: 0; transition: width .25s ease; }
main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; }
section { width: 100%; max-width: 980px; }
.shot { position: relative; display: inline-block; max-width: 100%; border-radius: 12px; overflow: hidden; background: #fff; }
.shot img { display: block; max-width: 100%; height: auto; }
.hotspot { position: absolute; width: 34px; height: 34px; transform: translate(-50%, -50%); border: 0; padding: 0; background: none; cursor: pointer; }
.hotspot .ring { position: absolute; inset: 0; border-radius: 50%; background: currentColor; opacity: .45; animation: pulse 1.6s ease-out infinite; }
.hotspot .dot { position: absolute; left: 50%; top: 50%; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 3px rgba(255, 255, 255, .85); }
@keyframes pulse { 0% { transform: scale(.45); opacity: .6; } 100% { transform: scale(1); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .hotspot .ring { animation: none; opacity: .3; } }
.caption { margin-top: 18px; font-size: 18px; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
.heading { font-size: 26px; font-weight: 700; line-height: 1.3; white-space: pre-wrap; }
footer { display: flex; align-items: center; gap: 12px; padding: 16px 24px; border-top: 1px solid rgba(248, 250, 252, .12); }
#fn-counter { flex: 1; font-size: 13px; color: #CBD5E1; }
button.control { font: inherit; font-size: 14px; font-weight: 600; padding: 9px 18px; border-radius: 999px; border: 1px solid rgba(248, 250, 252, .24); background: transparent; color: #F8FAFC; cursor: pointer; }
button.control:disabled { opacity: .35; cursor: default; }
button.control.primary { border-color: transparent; color: #0B1020; }`;

export async function exportGuideAsDemo(
  guide: Guide,
  steps: Step[],
  screenshots: Map<string, Screenshot>,
  options?: ExportOptions,
): Promise<string> {
  const opts = options ?? (await loadExportOptions());
  const brand = await loadBranding();
  const accent = brand.accent;
  const numbers = stepNumbers(steps);
  const slides: string[] = [];

  for (const step of steps) {
    const position = slides.length + 1;
    const counter = escapeHtml(i18n.t('export.stepOf', [String(position), String(steps.length)]));

    if (isBlock(step)) {
      const className = step.blockType === 'heading' ? 'heading' : 'caption';
      slides.push(
        `<section data-slide="${position}" data-counter="${counter}" hidden><p class="${className}">${escapeHtml(step.description)}</p></section>`,
      );
      continue;
    }

    const number = numbers.get(step.id) ?? position;
    const screenshot = opts.screenshots ? screenshots.get(step.id) : undefined;
    const altText = screenshot?.edits?.alt || i18n.t('export.stepLabel', [String(number)]);
    const stage = screenshot ? await stageHtml(screenshot, altText) : '';
    const caption = opts.stepDescriptions ? `<p class="caption">${escapeHtml(step.description)}</p>` : '';
    slides.push(`<section data-slide="${position}" data-counter="${counter}" hidden>${stage}${caption}</section>`);
  }

  let logoHtml = '';
  if (brand.logo) {
    const { width, height } = fitLogo(brand.logo, LOGO_MAX_WIDTH, LOGO_MAX_HEIGHT);
    logoHtml = `<img src="${brand.logo.dataUrl}" width="${width}" height="${height}" alt="" />`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(guide.title)}</title>
  ${guide.description ? `<meta name="description" content="${escapeHtml(guide.description)}">` : ''}
  <style>
    ${POPPINS_FONT_FACES}
    ${DEMO_STYLE}
    .track span, button.control.primary { background: ${accent}; }
    .hotspot { color: ${accent}; }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(guide.title)}</h1>
    ${logoHtml}
  </header>
  <div class="track" role="progressbar" aria-label="${escapeHtml(i18n.t('demo.progress'))}"><span id="fn-bar"></span></div>
  <main>
    ${slides.join('\n    ')}
  </main>
  <footer>
    <span id="fn-counter" aria-live="polite"></span>
    <button type="button" class="control" id="fn-back">${escapeHtml(i18n.t('demo.back'))}</button>
    <button type="button" class="control primary" id="fn-next">${escapeHtml(i18n.t('demo.next'))}</button>
  </footer>
  <script>${DEMO_SCRIPT}</script>
</body>
</html>`;
}
