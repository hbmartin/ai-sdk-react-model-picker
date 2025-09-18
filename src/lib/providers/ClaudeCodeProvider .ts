type ClaudeCodeModule = typeof import('ai-sdk-provider-claude-code');
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ModelConfig, ProviderMetadata, ProviderInstanceParams } from '../types';
import { AIProvider, createProviderId, createModelId } from '../types';
import { ClaudeIcon } from '../icons';
import { makeConfiguration, type ConfigAPI } from './configuration';
import type { ClaudeCodeProviderSettings, ClaudeCodeSettings } from 'ai-sdk-provider-claude-code';

export class ClaudeCodeProvider extends AIProvider {
  // eslint-disable-next-line sonarjs/public-static-readonly
  static defaultSettings: ClaudeCodeSettings = {};
  readonly metadata: ProviderMetadata = {
    id: createProviderId('claude-code'),
    name: 'Claude Code',
    description: 'Use Claude Code models',
    icon: ClaudeIcon,
    documentationUrl: 'https://docs.claude.com/en/docs/claude-code/model-config',
    apiKeyUrl: 'https://docs.claude.com/en/docs/claude-code/quickstart',
    warning: 'You must have Claude Code installed and logged in to use this provider.',
  };

  readonly models: ModelConfig[] = [
    {
      id: createModelId('default'),
      displayName: 'Claude Code',
      isDefault: true,
      supportsTools: true,
    },
    {
      id: createModelId('sonnet'),
      displayName: 'Sonnet 4',
      maxTokens: 200_000,
      supportsTools: true,
    },
    {
      id: createModelId('opus'),
      displayName: 'Opus 4.1',
      maxTokens: 200_000,
      supportsTools: true,
    },
    {
      id: createModelId('sonnet[1m]'),
      displayName: 'Sonnet 4 [1m window]',
      maxTokens: 1_000_000,
      supportsTools: true,
    },
    {
      id: createModelId('opusplan'),
      displayName: 'Opus (plan) -> Sonnet (execution)',
      maxTokens: 200_000,
      supportsTools: true,
    },
  ];

  override readonly configuration: ConfigAPI<ClaudeCodeProviderSettings> =
    makeConfiguration<ClaudeCodeProviderSettings>()({ fields: [] });

  async createInstance(params: ProviderInstanceParams): Promise<LanguageModelV2> {
    // Dynamic import to avoid bundling if not needed
    let claudeCode: ClaudeCodeModule;

    try {
      // This will be a peer dependency
      claudeCode = await import('ai-sdk-provider-claude-code');
    } catch {
      throw new Error(
        'Claude Code provider requires "ai-sdk-provider-claude-code" to be installed. ' +
          'Please install it with: npm install ai-sdk-provider-claude-code'
      );
    }
    const client = claudeCode.createClaudeCode({
      defaultSettings: ClaudeCodeProvider.defaultSettings,
    });
    return client(params.model);
  }
}
