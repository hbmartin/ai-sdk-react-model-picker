import { describe, expect, it } from 'vitest';
import { createDefaultRegistry } from '../src/lib/providers';
import { QwenProvider } from '../src/lib/providers/QwenProvider';
import { ZaiProvider } from '../src/lib/providers/ZaiProvider';
import { createProviderId } from '../src/lib/types';

describe('QwenProvider', () => {
  it('requires an API key', () => {
    const provider = new QwenProvider();
    expect(provider.validateCredentials({}).isValid).toBe(false);
    expect(provider.validateCredentials({ apiKey: 'sk-abc123' }).isValid).toBe(true);
  });

  it('offers Qwen 3 models with qwen3-max as default', () => {
    const provider = new QwenProvider();
    const ids = provider.models.map((model) => model.id as string);
    expect(ids).toContain('qwen3-max');
    expect(ids).toContain('qwen3-coder-plus');
    const defaults = provider.models.filter((model) => model.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].id as string).toBe('qwen3-max');
  });
});

describe('ZaiProvider', () => {
  it('requires an API key', () => {
    const provider = new ZaiProvider();
    expect(provider.validateCredentials({}).isValid).toBe(false);
    expect(provider.validateCredentials({ apiKey: 'a'.repeat(32) }).isValid).toBe(true);
  });

  it('offers GLM 4.6 as the default model', () => {
    const provider = new ZaiProvider();
    const defaults = provider.models.filter((model) => model.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].id as string).toBe('glm-4.6');
  });
});

describe('default registry', () => {
  it('includes Qwen and Z.ai providers', () => {
    const registry = createDefaultRegistry();
    expect(registry.getProvider(createProviderId('qwen'))).toBeInstanceOf(QwenProvider);
    expect(registry.getProvider(createProviderId('zai'))).toBeInstanceOf(ZaiProvider);
  });
});
