import { describe, expect, it } from 'vitest';
import { createDefaultRegistry } from '../src/lib/providers';
import { ClaudeCodeProvider } from '../src/lib/providers/ClaudeCodeProvider';
import { createProviderId } from '../src/lib/types';

describe('ClaudeCodeProvider', () => {
  it('is valid with no configuration (auth handled by the CLI)', () => {
    const provider = new ClaudeCodeProvider();
    expect(provider.validateCredentials({}).isValid).toBe(true);
    expect(provider.hasCredentials({})).toBe(true);
  });

  it('accepts optional cwd and executable path settings', () => {
    const provider = new ClaudeCodeProvider();
    const result = provider.validateCredentials({
      cwd: '/some/project',
      pathToClaudeCodeExecutable: '/usr/local/bin/claude',
    });
    expect(result.isValid).toBe(true);
  });

  it('provides builtin model aliases with a default', () => {
    const provider = new ClaudeCodeProvider();
    const ids = provider.models.map((model) => model.id as string);
    expect(ids).toContain('sonnet');
    expect(ids).toContain('opus');
    expect(ids).toContain('haiku');
    expect(provider.models.filter((model) => model.isDefault)).toHaveLength(1);
  });

  it('is registered in the default registry', () => {
    const registry = createDefaultRegistry();
    expect(registry.getProvider(createProviderId('claude-code'))).toBeInstanceOf(
      ClaudeCodeProvider
    );
  });
});
