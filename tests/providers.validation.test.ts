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

  it('warns about key prefix only when using the default base URL', () => {
    const provider = new OpenAIProvider();

    const defaultEndpoint = provider.validateCredentials({ apiKey: 'my-custom-key' });
    expect(defaultEndpoint.isValid).toBe(true);
    expect(defaultEndpoint.warning).toContain('sk-');

    // Custom endpoints (proxies, compatible gateways) issue their own key formats
    const customEndpoint = provider.validateCredentials({
      apiKey: 'my-custom-key',
      baseURL: 'https://llm.example.com/v1',
    });
    expect(customEndpoint.isValid).toBe(true);
    expect(customEndpoint.warning).toBeUndefined();
  });

  it('field-level validation also respects a custom base URL', () => {
    const provider = new OpenAIProvider();
    expect(provider.configuration.validateField('apiKey', 'my-custom-key')?.warning).toContain(
      'sk-'
    );
    expect(
      provider.configuration.validateField('apiKey', 'my-custom-key', {
        baseURL: 'https://llm.example.com/v1',
      })
    ).toBeUndefined();
  });
});
