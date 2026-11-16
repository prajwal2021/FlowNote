// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportGuideAsDemo } from '@/core/export/demo-export';
import { DEFAULT_EXPORT_OPTIONS } from '@/core/export/options';
import type { Guide, Screenshot, Step } from '@/core/guides/types';

const rendered = vi.hoisted(() => vi.fn());

vi.mock('@/core/screenshot/render', () => ({ renderScreenshot: rendered }));

const guide: Guide = {
  id: 'guide-1',
  title: 'Test Guide',
  createdAt: new Date('2025-06-01T00:00:00Z').getTime(),
  updatedAt: new Date('2025-06-01T00:00:00Z').getTime(),
  stepIds: [],
  starred: false,
  deletedAt: null,
};

function makeStep(index: number): Step {
  return {
    id: `step-${index}`,
    guideId: 'guide-1',
    index,
    description: `Click the button ${index}`,
    action: 'click',
    url: 'https://example.com/page',
    timestamp: guide.createdAt,
  };
}

function makeScreenshot(stepId: string, extra: Partial<Screenshot> = {}): Screenshot {
  return {
    id: `shot-${stepId}`,
    stepId,
    blob: new Blob(['raw'], { type: 'image/png' }),
    mimeType: 'image/png',
    width: 1000,
    height: 500,
    ...extra,
  };
}

function render(steps: Step[], screenshots: Map<string, Screenshot>) {
  return exportGuideAsDemo(guide, steps, screenshots, DEFAULT_EXPORT_OPTIONS);
}

function hotspotStyles(html: string): string[] {
  return [...html.matchAll(/data-hotspot="true" class="hotspot" style="([^"]+)"/g)].map((m) => m[1]!);
}

describe('exportGuideAsDemo', () => {
  beforeEach(() => {
    rendered.mockReset();
    rendered.mockImplementation(async () => new Blob(['rendered'], { type: 'image/webp' }));
  });

  it('makes one slide per step, hidden until the viewer reaches it', async () => {
    const steps = Array.from({ length: 4 }, (_, i) => makeStep(i));
    const shots = new Map(steps.map((s) => [s.id, makeScreenshot(s.id, { clickPoint: { x: 500, y: 250 } })]));

    const html = await render(steps, shots);

    expect(html.match(/data-slide="/g)).toHaveLength(4);
    expect(html.match(/ hidden>/g)).toHaveLength(4);
    expect(html).toContain('data-counter="export.stepOf[1,4]"');
    expect(html).toContain('data-counter="export.stepOf[4,4]"');
    expect(html).toContain('id="fn-bar"');
    expect(html).toContain('id="fn-next"');
  });

  it('places the hotspot from the click point, in image pixels', async () => {
    const steps = [makeStep(0)];
    const shots = new Map([[steps[0]!.id, makeScreenshot(steps[0]!.id, { clickPoint: { x: 250, y: 400 } })]]);

    const html = await render(steps, shots);

    expect(hotspotStyles(html)).toEqual(['left:25%;top:80%;']);
  });

  it('accounts for the device pixel ratio', async () => {
    const steps = [makeStep(0)];
    const shots = new Map([
      [steps[0]!.id, makeScreenshot(steps[0]!.id, { clickPoint: { x: 125, y: 200 }, pixelRatio: 2 })],
    ]);

    const html = await render(steps, shots);

    expect(hotspotStyles(html)).toEqual(['left:25%;top:80%;']);
  });

  it('places the hotspot relative to a cropped viewport', async () => {
    const steps = [makeStep(0)];
    const shots = new Map([
      [
        steps[0]!.id,
        makeScreenshot(steps[0]!.id, {
          clickPoint: { x: 600, y: 300 },
          edits: { viewport: { x: 400, y: 200, width: 400, height: 200 } },
        }),
      ],
    ]);

    const html = await render(steps, shots);

    expect(hotspotStyles(html)).toEqual(['left:50%;top:50%;']);
  });

  it('drops the hotspot when the click point falls outside the crop', async () => {
    const steps = [makeStep(0)];
    const shots = new Map([
      [
        steps[0]!.id,
        makeScreenshot(steps[0]!.id, {
          clickPoint: { x: 50, y: 50 },
          edits: { viewport: { x: 400, y: 200, width: 400, height: 200 } },
        }),
      ],
    ]);

    const html = await render(steps, shots);

    expect(hotspotStyles(html)).toEqual([]);
    expect(html).toContain('data-slide="1"');
    expect(html).toContain('<img src="data:image/webp;base64,');
  });

  it('still renders a step that has no click point', async () => {
    const steps = [makeStep(0)];
    const shots = new Map([[steps[0]!.id, makeScreenshot(steps[0]!.id)]]);

    const html = await render(steps, shots);

    expect(hotspotStyles(html)).toEqual([]);
    expect(html).not.toContain('class="hotspot"');
    expect(html).toContain('<img src="data:image/webp;base64,');
    expect(html).toContain('Click the button 0');
  });

  it('still renders and counts a step that has no screenshot', async () => {
    const steps = [makeStep(0), makeStep(1)];
    const shots = new Map([[steps[1]!.id, makeScreenshot(steps[1]!.id, { clickPoint: { x: 500, y: 250 } })]]);

    const html = await render(steps, shots);

    expect(rendered).toHaveBeenCalledTimes(1);
    expect(html.match(/data-slide="/g)).toHaveLength(2);
    expect(html).toContain('data-counter="export.stepOf[1,2]"');
    expect(html).toContain('Click the button 0');
    expect(hotspotStyles(html)).toEqual(['left:50%;top:50%;']);
  });

  it('goes through the renderer so redactions are burned into the pixels', async () => {
    const steps = [makeStep(0)];
    const shot = makeScreenshot(steps[0]!.id, {
      edits: { annotations: [{ id: 'r', type: 'redact', x: 0, y: 0, w: 10, h: 10 }] } as Screenshot['edits'],
    });

    const html = await render(steps, new Map([[steps[0]!.id, shot]]));

    expect(rendered).toHaveBeenCalledWith(shot);
    expect(html).not.toContain('filter:');
    expect(html).not.toContain('backdrop-filter');
  });

  it('carries its own Poppins and asks no one else for a font', async () => {
    const html = await render([makeStep(0)], new Map());

    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');
    expect(html).toMatch(/font-weight: 700; font-display: swap; src: url\(data:font\/woff2;base64,/);
  });

  it('renders a heading block as its own slide', async () => {
    const heading: Step = { ...makeStep(0), blockType: 'heading', description: 'Part one' };
    const action = makeStep(1);
    const shots = new Map([[action.id, makeScreenshot(action.id)]]);

    const html = await render([heading, action], shots);

    expect(html).toContain('class="heading"');
    expect(html).toContain('Part one');
    expect(html.match(/data-slide="/g)).toHaveLength(2);
  });
});

describe('exportGuideAsDemo viewer', () => {
  beforeEach(() => {
    rendered.mockReset();
    rendered.mockImplementation(async () => new Blob(['rendered'], { type: 'image/webp' }));
  });

  async function mount(steps: Step[], shots: Map<string, Screenshot>) {
    const html = await render(steps, shots);
    document.documentElement.innerHTML = html.slice(html.indexOf('<head>'));
    const script = document.querySelector('script')!.textContent!;
    new Function(script)();
    const visible = () =>
      [...document.querySelectorAll('[data-slide]')].findIndex((slide) => !(slide as HTMLElement).hidden);
    return { visible, bar: document.getElementById('fn-bar')!, counter: document.getElementById('fn-counter')! };
  }

  it('starts on the first step and advances by hotspot, key and the next control', async () => {
    const steps = [makeStep(0), makeStep(1), makeStep(2)];
    const shots = new Map(steps.map((s) => [s.id, makeScreenshot(s.id, { clickPoint: { x: 500, y: 250 } })]));

    const { visible, bar, counter } = await mount(steps, shots);

    expect(visible()).toBe(0);
    expect(counter.textContent).toBe('export.stepOf[1,3]');
    expect(bar.style.width).toBe(`${(1 / 3) * 100}%`);

    document.querySelector<HTMLElement>('[data-slide="1"] [data-hotspot]')!.click();
    expect(visible()).toBe(1);

    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(visible()).toBe(2);
    expect(counter.textContent).toBe('export.stepOf[3,3]');
    expect(document.querySelector<HTMLButtonElement>('#fn-next')!.disabled).toBe(true);

    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(visible()).toBe(1);

    document.querySelector<HTMLButtonElement>('#fn-next')!.click();
    expect(visible()).toBe(2);
  });

  it('advances past a step that has neither screenshot nor click point', async () => {
    const steps = [makeStep(0), makeStep(1)];
    const { visible } = await mount(steps, new Map());

    expect(visible()).toBe(0);
    document.querySelector<HTMLButtonElement>('#fn-next')!.click();
    expect(visible()).toBe(1);
  });
});
