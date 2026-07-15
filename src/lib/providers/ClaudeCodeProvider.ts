type ClaudeCodeModule = typeof import('ai-sdk-provider-claude-code');
import type { LanguageModelV4 } from '@ai-sdk/provider';
import type { ModelConfig, ProviderMetadata, ProviderInstanceParams } from '../types';
import { AIProvider, createProviderId, createModelId } from '../types';
import { ClaudeIcon } from '../icons';
import { makeConfiguration, type ConfigAPI } from './configuration';
import type { ClaudeCodeSettings } from 'ai-sdk-provider-claude-code';

/**
 * String-valued subset of ClaudeCodeSettings that can be collected through
 * the configuration form. Auth happens through the Claude Code CLI login,
 * so no API key is required.
 */
type ClaudeCodeConfig = Pick<ClaudeCodeSettings, 'cwd' | 'pathToClaudeCodeExecutable'>;

export class ClaudeCodeProvider extends AIProvider {
  override readonly metadata: ProviderMetadata = {
    id: createProviderId('claude-code'),
    name: 'Claude Code',
    description: 'Use your Claude subscription through the Claude Code CLI — no API key required.',
    icon: ClaudeIcon,
    documentationUrl: 'https://docs.anthropic.com/en/docs/claude-code/overview',
  };

  override readonly models: ModelConfig[] = [
    {
      id: createModelId('sonnet'),
      displayName: 'Claude Sonnet',
      supportsVision: true,
      supportsTools: true,
      isDefault: true,
      origin: 'builtin',
      visible: true,
    },
    {
      id: createModelId('opus'),
      displayName: 'Claude Opus',
      supportsVision: true,
      supportsTools: true,
      origin: 'builtin',
      visible: true,
    },
    {
      id: createModelId('haiku'),
      displayName: 'Claude Haiku',
      supportsVision: true,
      supportsTools: true,
      origin: 'builtin',
      visible: true,
    },
  ];

  override readonly configuration: ConfigAPI<ClaudeCodeConfig> =
    makeConfiguration<ClaudeCodeConfig>()({
      fields: [
        {
          key: 'pathToClaudeCodeExecutable',
          label: 'Path to Claude Code executable (optional)',
          placeholder: 'claude',
        },
        {
          key: 'cwd',
          label: 'Working directory (optional)',
          placeholder: '/path/to/project',
        },
      ],
    });

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV4> {
    // Dynamic import to avoid bundling if not needed
    let claudeCodeModule: ClaudeCodeModule;

    try {
      // This will be a peer dependency
      claudeCodeModule = await import('ai-sdk-provider-claude-code');
    } catch {
      throw new Error(
        'Claude Code provider requires "ai-sdk-provider-claude-code" to be installed. ' +
          'Please install it with: npm install ai-sdk-provider-claude-code'
      );
    }

    const options = params.options ?? {};
    this.configuration.assertValidConfigAndRemoveEmptyKeys(options);

    const client = claudeCodeModule.createClaudeCode({ defaultSettings: options });
    return client(params.model);
  }
}
