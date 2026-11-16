import { beforeEach, describe, expect, it, vi } from 'vitest';

const { generateObjectMock } = vi.hoisted(() => ({ generateObjectMock: vi.fn() }));

vi.mock('ai', () => ({
  generateObject: generateObjectMock,
  generateText: vi.fn(),
  jsonSchema: (schema: unknown) => schema,
}));

vi.mock('../provider', () => ({ createModel: () => ({ id: 'test-model' }) }));

import { translateGuide } from '../translate-guide';

function manySteps(count: number) {
  return Array.from({ length: count }, (_, i) => ({ id: `s${i}`, description: `Click "Save" ${i}` }));
}

function options(over: Partial<Parameters<typeof translateGuide>[0]> = {}) {
  return {
    title: 'Reset a password',
    description: 'How to reset it.',
    steps: manySteps(3),
    language: 'Spanish',
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: 'key',
    ...over,
  };
}

function answer(steps: { id: string; text: string }[], title: string | null = 'Restablecer una contraseña') {
  return { object: { title, description: 'Cómo restablecerla.', steps } };
}

describe('translateGuide', () => {
  beforeEach(() => {
    generateObjectMock.mockReset();
  });

  it('translates the title, the description and every step in one pass', async () => {
    generateObjectMock.mockResolvedValue(
      answer([
        { id: 's0', text: 'Haz clic en "Save" 0' },
        { id: 's1', text: 'Haz clic en "Save" 1' },
        { id: 's2', text: 'Haz clic en "Save" 2' },
      ]),
    );

    const result = await translateGuide(options());

    expect(generateObjectMock).toHaveBeenCalledTimes(1);
    expect(result?.title).toBe('Restablecer una contraseña');
    expect(result?.description).toBe('Cómo restablecerla.');
    expect([...(result?.steps.entries() ?? [])]).toEqual([
      ['s0', 'Haz clic en "Save" 0'],
      ['s1', 'Haz clic en "Save" 1'],
      ['s2', 'Haz clic en "Save" 2'],
    ]);
  });

  it('splits a long guide into several requests so one answer stays inside the output limit', async () => {
    generateObjectMock.mockImplementation(() => Promise.resolve(answer([])));

    await translateGuide(options({ steps: manySteps(20) }));

    expect(generateObjectMock).toHaveBeenCalledTimes(3);
    const sent = generateObjectMock.mock.calls.map(
      (call) => (call[0].prompt as string).match(/\[s\d+\]/g)?.length ?? 0,
    );
    expect(sent).toEqual([8, 8, 4]);
  });

  it('asks for the title only once, with the first chunk', async () => {
    generateObjectMock.mockImplementation(() => Promise.resolve(answer([])));

    await translateGuide(options({ steps: manySteps(12) }));

    const prompts = generateObjectMock.mock.calls.map((call) => call[0].prompt as string);
    expect(prompts[0]).toContain('Reset a password');
    expect(prompts[1]).not.toContain('Reset a password');
  });

  it('stitches a chunk back together by step id, not by the order the model answered in', async () => {
    generateObjectMock.mockImplementation(({ prompt }: { prompt: string }) =>
      Promise.resolve(
        prompt.includes('[s0]')
          ? answer([
              { id: 's2', text: 'tercero' },
              { id: 's0', text: 'primero' },
              { id: 's1', text: 'segundo' },
            ])
          : answer([]),
      ),
    );

    const result = await translateGuide(options());

    expect(result?.steps.get('s0')).toBe('primero');
    expect(result?.steps.get('s1')).toBe('segundo');
    expect(result?.steps.get('s2')).toBe('tercero');
  });

  it('ignores an id the model invented rather than pinning it to a step', async () => {
    generateObjectMock.mockResolvedValue(
      answer([
        { id: 'made-up', text: 'inventado' },
        { id: 's1', text: 'segundo' },
      ]),
    );

    const result = await translateGuide(options());

    expect(result?.steps.has('made-up')).toBe(false);
    expect([...(result?.steps.keys() ?? [])]).toEqual(['s1']);
  });

  it('keeps a step out of the result when its translation comes back empty, so the original text stands', async () => {
    generateObjectMock.mockResolvedValue(
      answer([
        { id: 's0', text: '   ' },
        { id: 's1', text: 'segundo' },
      ]),
    );

    const result = await translateGuide(options());

    expect(result?.steps.has('s0')).toBe(false);
    expect(result?.steps.get('s1')).toBe('segundo');
  });

  it('keeps the original title and description when the model returns neither', async () => {
    generateObjectMock.mockResolvedValue({ object: { title: null, description: null, steps: [] } });

    const result = await translateGuide(options());

    expect(result?.title).toBe('Reset a password');
    expect(result?.description).toBe('How to reset it.');
  });

  it('returns null when the provider fails', async () => {
    generateObjectMock.mockRejectedValue(new Error('rate limited'));

    expect(await translateGuide(options())).toBeNull();
  });

  it('reports the failure reason so the screen can name it', async () => {
    generateObjectMock.mockRejectedValue(Object.assign(new Error('nope'), { statusCode: 401 }));
    const onFailure = vi.fn();

    await translateGuide(options({ onFailure }));

    expect(onFailure).toHaveBeenCalledWith(expect.objectContaining({ reason: 'rejected', status: 401 }));
  });

  it('abandons the whole translation when a later chunk fails, rather than saving half of it', async () => {
    generateObjectMock
      .mockResolvedValueOnce(answer([{ id: 's0', text: 'primero' }]))
      .mockRejectedValueOnce(new Error('rate limited'));

    expect(await translateGuide(options({ steps: manySteps(12) }))).toBeNull();
  });

  it('gives up on a model that never answers', async () => {
    vi.useFakeTimers();
    generateObjectMock.mockImplementation(
      ({ abortSignal }: { abortSignal?: AbortSignal }) =>
        new Promise((_, reject) => abortSignal?.addEventListener('abort', () => reject(new Error('aborted')))),
    );

    const pending = translateGuide(options());
    await vi.waitUntil(() => generateObjectMock.mock.calls.length > 0);
    await vi.advanceTimersByTimeAsync(90_000);

    expect(await pending).toBeNull();
    vi.useRealTimers();
  });

  it('tells the model to leave on-screen names untranslated', async () => {
    generateObjectMock.mockResolvedValue(answer([]));

    await translateGuide(options());

    const prompt = generateObjectMock.mock.calls[0]![0].prompt as string;
    expect(prompt).toMatch(/never translate the name of anything the reader has to find on the screen/i);
    expect(prompt).toContain('Spanish');
    expect(prompt).not.toMatch(/\{\{\w+\}\}/);
  });

  it('does not let step text act as a replacement pattern', async () => {
    generateObjectMock.mockResolvedValue(answer([]));

    await translateGuide(options({ steps: [{ id: 's0', description: 'Enter $& then $`' }] }));

    expect(generateObjectMock.mock.calls[0]![0].prompt).toContain('Enter $& then $`');
  });

  it('marks every declared property as required, as strict mode demands', async () => {
    generateObjectMock.mockResolvedValue(answer([]));

    await translateGuide(options());

    const { schema } = generateObjectMock.mock.calls[0]![0];
    expect(schema.required.sort()).toEqual(Object.keys(schema.properties).sort());
  });

  it('returns null without calling the model when there is nothing to translate', async () => {
    expect(await translateGuide(options({ title: '', description: undefined, steps: [] }))).toBeNull();
    expect(generateObjectMock).not.toHaveBeenCalled();
  });

  it('still translates the title of a guide that has no described steps', async () => {
    generateObjectMock.mockResolvedValue(answer([]));

    const result = await translateGuide(options({ steps: [] }));

    expect(generateObjectMock).toHaveBeenCalledTimes(1);
    expect(result?.title).toBe('Restablecer una contraseña');
  });
});
