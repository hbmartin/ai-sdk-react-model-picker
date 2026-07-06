import { afterEach, describe, expect, it, vi } from 'vitest';
import { LmStudioProvider } from '../src/lib/providers/LmStudioProvider';

// Shaped like LM Studio's `/api/v0/models` response with JIT loading enabled:
// every downloaded model is listed (loaded or not), including 'vlm' entries
const JIT_MODEL_LIST = {
  data: [
    {
      id: 'qwen2.5-7b-instruct',
      object: 'model',
      type: 'llm',
      state: 'not-loaded',
      max_context_length: 32_768,
      capabilities: ['tool_use'],
    },
    {
      id: 'qwen2-vl-7b-instruct',
      object: 'model',
      type: 'vlm',
      state: 'not-loaded',
      max_context_length: 32_768,
      capabilities: ['vision'],
    },
    {
      id: 'text-embedding-nomic-embed-text-v1.5',
      object: 'model',
      type: 'embeddings',
      state: 'not-loaded',
      max_context_length: 2048,
    },
  ],
};

function mockFetchWith(payload: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(payload),
    })
  );
}

describe('LmStudioProvider.fetchModels', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists downloaded (not-loaded) models, including vlm entries', async () => {
    mockFetchWith(JIT_MODEL_LIST);
    const provider = new LmStudioProvider();
    const models = await provider.fetchModels(undefined);

    const ids = models.map((model) => model.id as string);
    expect(ids).toContain('qwen2.5-7b-instruct');
    expect(ids).toContain('qwen2-vl-7b-instruct');
    // embeddings models are not chat models
    expect(ids).not.toContain('text-embedding-nomic-embed-text-v1.5');

    const vlm = models.find((model) => (model.id as string) === 'qwen2-vl-7b-instruct');
    expect(vlm?.supportsVision).toBe(true);
  });

  it('skips malformed entries instead of failing the whole list', async () => {
    mockFetchWith({
      data: [
        { id: 'good-model', type: 'llm' },
        { type: 'llm' }, // missing id
        'not-an-object',
        { id: 'future-model', type: 'some-new-type' },
      ],
    });
    const provider = new LmStudioProvider();
    const models = await provider.fetchModels(undefined);
    expect(models.map((model) => model.id as string)).toEqual(['good-model', 'future-model']);
  });

  it('still rejects a payload without a data array', async () => {
    mockFetchWith({ error: 'nope' });
    const provider = new LmStudioProvider();
    await expect(provider.fetchModels(undefined)).rejects.toThrow(
      'Unexpected LM Studio model list response payload'
    );
  });
});
