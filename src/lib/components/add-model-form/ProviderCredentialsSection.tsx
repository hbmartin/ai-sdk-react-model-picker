import { ProviderSelectionListbox } from '../ProviderSelectionListbox';
import type { AddModelFormData } from './types';
import type { AIProvider, ProviderMetadata } from '../../types';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

export interface ProviderCredentialsSectionProps {
  readonly topProviders: ProviderMetadata[];
  readonly otherProviders: ProviderMetadata[];
  readonly selectedProvider: AIProvider | undefined;
  readonly onProviderSelected: (provider: ProviderMetadata) => void;
  readonly register: UseFormRegister<AddModelFormData>;
  readonly errors: FieldErrors<AddModelFormData>;
  readonly warnings: Record<string, string>;
  readonly validateField: (key: string, value: string | undefined) => string | undefined;
  readonly className?: string;
}

export function ProviderCredentialsSection({
  topProviders,
  otherProviders,
  selectedProvider,
  onProviderSelected,
  register,
  errors,
  warnings,
  validateField,
  className = '',
}: ProviderCredentialsSectionProps) {
  const containerClassName = ['space-y-6', className].filter(Boolean).join(' ');
  return (
    <div className={containerClassName}>
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Provider</label>
        <ProviderSelectionListbox
          selectedItem={selectedProvider?.metadata}
          onSelectionChange={(provider) => onProviderSelected(provider)}
          topOptions={topProviders}
          otherOptions={otherProviders}
        />
        <p className="mt-1 text-xs text-muted">
          Don't see your provider?{' '}
          <a
            href="https://github.com/hbmartin/ai-sdk-react-model-picker/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Request one here
          </a>
        </p>
      </div>

      {selectedProvider?.configuration.fields.map(({ key, label, placeholder, required }) => (
        <div key={key}>
          <label className="mb-2 block text-sm font-medium text-foreground">
            {label}
            {required === true ? ' *' : ''}
          </label>
          <input
            placeholder={placeholder}
            autoComplete="off"
            spellCheck="false"
            autoCorrect="off"
            autoCapitalize="off"
            type="text"
            className="w-full rounded border border-border border-solid bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            {...register(key, {
              validate: (value) => validateField(key, value),
            })}
          />
          {errors[key] && (
            <p className="mt-1 px-1 text-xs text-destructive">{errors[key]?.message}</p>
          )}
          {key in warnings && !(key in errors) && (
            <p className="mt-1 px-1 text-xs text-warning">{warnings[key]}</p>
          )}
          {key === 'apiKey' &&
            selectedProvider.metadata.apiKeyUrl !== undefined &&
            !(key in warnings) &&
            !(key in errors) && (
              <p className="mt-1 text-xs text-muted">
                <a
                  href={selectedProvider.metadata.apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Get your API key here
                </a>
              </p>
            )}
        </div>
      ))}
    </div>
  );
}

export default ProviderCredentialsSection;
