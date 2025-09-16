import { describe, expect, it } from 'vitest';
import { OpenAIProvider } from '../src/lib/providers/OpenAIProvider';

describe('Provider configuration validation', () => {
  it('invalid when required fields missing', () => {
    const provider = new OpenAIProvider();
    const result = provider.validateCredentials({});
    expect(result.isValid).toBe(false);
  });

  it('valid with apiKey or baseURL', () => {
    const provider = new OpenAIProvider();
    expect(provider.validateCredentials({ apiKey: 'sk-abc' }).isValid).toBe(true);
    expect(provider.validateCredentials({ baseURL: 'https://api.example.com' }).isValid).toBe(true);
  });
});
