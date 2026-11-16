import { FLOWNOTE_MARK } from '@/core/brand/flownote-mark';
import { createOverlayRoot } from '@/core/capture/dom/overlay-root';
import { svgElement } from './dom/svg-element';

const ANIMATION_DURATION_MS = 4000;
const FILL_DURATION = '2s';
const FILL_DELAY = '0.5s';

const STYLES = `
  :host {
    position: fixed;
    inset: 0;
    z-index: 2147483646;
    pointer-events: none;
  }

  .wrap {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: show ${ANIMATION_DURATION_MS}ms ease forwards;
  }

  @keyframes show {
    0% { opacity: 0; }
    8% { opacity: 1; }
    75% { opacity: 1; }
    100% { opacity: 0; }
  }

  .mascot-wrap {
    position: relative;
    width: clamp(110px, 16vw, 200px);
    aspect-ratio: 1 / 1;
    animation: bounceSquash 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
  }

  .mascot-wrap svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  @keyframes bounceSquash {
    0%   { transform: translateY(-80px) scaleY(1.1) scaleX(0.9); opacity: 0; }
    25%  { transform: translateY(10px) scaleY(0.85) scaleX(1.12); opacity: 1; }
    40%  { transform: translateY(-15px) scaleY(1.05) scaleX(0.97); }
    55%  { transform: translateY(5px) scaleY(0.95) scaleX(1.03); }
    70%  { transform: translateY(-3px) scaleY(1.02) scaleX(0.99); }
    100% { transform: translateY(0) scaleY(1) scaleX(1); }
  }
`;

const LOGO_BOX = '0 0 100 100';
const LOGO_COLOR = '#CC0000';
const LOGO_STROKE = 'fill="none" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"';

function buildLogoSVG(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_BOX}" width="200" height="200">
    <defs>
      <mask id="riseMask">
        <rect x="0" y="0" width="100" height="100" fill="black"/>
        <rect x="0" y="100" width="100" height="100" fill="white">
          <animate attributeName="y" from="100" to="0" dur="${FILL_DURATION}" begin="${FILL_DELAY}" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.22 0.61 0.36 1"/>
        </rect>
      </mask>
    </defs>
    <path d="${FLOWNOTE_MARK}" stroke="${LOGO_COLOR}" opacity="0.3" ${LOGO_STROKE}/>
    <g mask="url(#riseMask)"><path d="${FLOWNOTE_MARK}" stroke="${LOGO_COLOR}" ${LOGO_STROKE}/></g>
  </svg>`;
}

export function showStartNotification(): Promise<void> {
  return new Promise((resolve) => {
    const { host, shadow } = createOverlayRoot(STYLES, 'flownote-notification');

    const wrap = document.createElement('div');
    wrap.className = 'wrap';

    const mascotWrap = document.createElement('div');
    mascotWrap.className = 'mascot-wrap';
    mascotWrap.append(svgElement(buildLogoSVG()));

    wrap.appendChild(mascotWrap);
    shadow.appendChild(wrap);
    document.documentElement.appendChild(host);

    wrap.addEventListener('animationend', (e) => {
      if (e.target !== wrap) return;
      host.remove();
      resolve();
    });
  });
}
