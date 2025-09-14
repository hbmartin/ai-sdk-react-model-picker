// ---- Type utilities
type RequiredStringKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : T[K] extends string ? K : never;
}[keyof T];

type OptionalStringKeys<T> = {
  [K in keyof T]-?: undefined extends T[K]
    ? Exclude<T[K], undefined> extends string
      ? K
      : never
    : never;
}[keyof T];

type NonStringRequiredKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : T[K] extends string ? never : K;
}[keyof T];

type StringSlice<T> = { [K in RequiredStringKeys<T>]-?: string } & {
  [K in OptionalStringKeys<T>]?: string;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ConfigTypeValidationResult<T> = {
  ok: boolean;
  missingRequired: RequiredStringKeys<T>[];
  extraneous: string[];
  fieldValidationErrors: string[];
  fieldValidationWarnings: string[];
  message: string | undefined;
};

export interface ConfigAPI<ConfigObj extends object> {
  requiresAtLeastOneOf: string[] | undefined;
  fields: ConfigurationField<ConfigObj>[];
  assert(
    rec: Record<string, string> | undefined
  ): asserts rec is Record<string, string> & StringSlice<ConfigObj>;
  validateConfig(record: Record<string, string>): ConfigTypeValidationResult<ConfigObj>;
  validateField(key: string, value: string): FieldValidationProblem | undefined;
}

function formatMessage(
  missing: readonly string[],
  fieldValidationErrors: readonly string[],
  unmetMinimumRequiredKeys: readonly string[] | undefined
) {
  const lines: string[] = [];
  if (missing.length > 0) {
    lines.push(`Missing required: ${missing.join(', ')}`);
  }
  if (fieldValidationErrors.length > 0) {
    lines.push(`Validation errors: ${fieldValidationErrors.join(', ')}`);
  }
  if (unmetMinimumRequiredKeys && unmetMinimumRequiredKeys.length > 0) {
    lines.push(`At least one of these are required: ${unmetMinimumRequiredKeys.join(', ')}`);
  }
  return lines.join('\n');
}

interface ConfigurationSpec<ConfigObj extends object> {
  fields: ConfigurationField<ConfigObj>[];
  requiresAtLeastOneOf?: (RequiredStringKeys<ConfigObj> | OptionalStringKeys<ConfigObj>)[];
}

export function makeConfiguration<ConfigObj extends object>(
  // Compile-time assertion: forbid *required* non-string props in ConfigObj.
  ..._assert: NonStringRequiredKeys<ConfigObj> extends never
    ? []
    : ['ERROR_required_non_string_keys_in_ConfigObj', NonStringRequiredKeys<ConfigObj>]
) {
  return (spec: ConfigurationSpec<ConfigObj>): ConfigAPI<ConfigObj> => {
    const { fields, requiresAtLeastOneOf } = spec;
    const required = new Set<string | number | symbol>(
      fields.filter((field) => field.required === true).map((field) => field.key)
    );
    const optional = new Set<string | number | symbol>(
      fields.filter((field) => field.required !== true).map((field) => field.key)
    );
    const fieldValidators: Map<
      string,
      undefined | ((value: string) => FieldValidationProblem | undefined)
    > = new Map(fields.map((field) => [String(field.key), field.validation]));

    // eslint-disable-next-line sonarjs/cognitive-complexity
    function validateConfig(record: Record<string, string>): ConfigTypeValidationResult<ConfigObj> {
      const missingRequired: string[] = [];
      for (const k of required) {
        if (!(k in record) || record[String(k)].trim().length === 0) {
          missingRequired.push(String(k));
        }
      }

      const extraneous: string[] = [];
      for (const k of Object.keys(record)) {
        if (!required.has(k) && !optional.has(k)) {
          extraneous.push(k);
        }
      }

      const fieldValidationErrors: string[] = [];
      const fieldValidationWarnings: string[] = [];
      for (const [key, validator] of fieldValidators) {
        if (key in record && validator !== undefined) {
          const validation = validator(record[key]);
          if (validation?.error !== undefined) {
            fieldValidationErrors.push(validation.error);
          }
          if (validation?.warning !== undefined) {
            fieldValidationWarnings.push(validation.warning);
          }
        }
      }

      const hasMinimumRequiredKeys = hasAny(record, requiresAtLeastOneOf);

      const ok =
        missingRequired.length === 0 &&
        fieldValidationErrors.length === 0 &&
        hasMinimumRequiredKeys;

      return {
        ok,
        missingRequired: missingRequired as RequiredStringKeys<ConfigObj>[],
        extraneous,
        fieldValidationErrors,
        fieldValidationWarnings,
        message: ok
          ? undefined
          : formatMessage(
              missingRequired,
              fieldValidationErrors,
              // eslint-disable-next-line sonarjs/no-nested-conditional
              hasMinimumRequiredKeys ? undefined : requiresAtLeastOneOf?.map(String)
            ),
      };
    }

    function validateField(key: string, value: string): FieldValidationProblem | undefined {
      if (fieldValidators.has(key)) {
        return fieldValidators.get(key)?.(value);
      }
      return undefined;
    }

    function assert(
      record: Record<string, string> | undefined
    ): asserts record is Record<string, string> & StringSlice<ConfigObj> {
      if (record === undefined) {
        if (required.size > 0) {
          throw new Error(
            `Configuration is undefined, but required keys are: ${[...required].join(', ')}`
          );
        }
        if (requiresAtLeastOneOf !== undefined && requiresAtLeastOneOf.length > 0) {
          throw new Error(
            `Configuration is undefined, but at least one of these keys is required: ${requiresAtLeastOneOf.join(', ')}`
          );
        }
        return;
      }

      const { ok, message } = validateConfig(record);
      if (!ok) {
        throw new Error(message);
      }
    }

    return {
      requiresAtLeastOneOf: requiresAtLeastOneOf?.map(String),
      fields,
      assert,
      validateConfig,
      validateField,
    };
  };
}

type FieldValidationProblem =
  | { warning: string; error?: never }
  | { warning?: never; error: string };

export interface ConfigurationField<T extends object> {
  key: RequiredStringKeys<T> | OptionalStringKeys<T>;
  label: string;
  placeholder: string;
  required?: boolean;
  validation?: (value: string) => FieldValidationProblem | undefined;
}

function hasAny<T extends object>(
  config: Record<string, string>,
  requiresAtLeastOneOf: (RequiredStringKeys<T> | OptionalStringKeys<T>)[] | undefined
): boolean {
  return (
    requiresAtLeastOneOf?.some(
      (key) => typeof config[String(key)] === 'string' && config[String(key)].trim().length > 0
    ) ?? true
  );
}

export function baseUrlField<T extends { baseURL?: string }>(
  placeholder: string,
  // eslint-disable-next-line code-complete/no-boolean-params
  required: boolean = false
): ConfigurationField<T> {
  return {
    key: 'baseURL' as OptionalStringKeys<T>,
    label: required ? 'API Base URL' : 'API Base URL (optional)',
    placeholder,
    required,
    validation: (value: string | undefined) => {
      if (required && (value === undefined || value.trim().length === 0)) {
        return { error: 'API key is required' };
      }
      if (value?.startsWith('https://') === false) {
        return { warning: 'API base URL typically starts with "https://"' };
      }
      return undefined;
    },
  };
}

export function apiKeyField<T extends { apiKey?: string }>(
  requirement: string | number,
  // eslint-disable-next-line code-complete/no-boolean-params
  required: boolean = false
): ConfigurationField<T> {
  return {
    key: 'apiKey' as OptionalStringKeys<T>,
    label: 'API Key',
    placeholder: typeof requirement === 'string' ? `${requirement}...` : '',
    required,
    validation: (value: string | undefined) => {
      if (required && (value === undefined || value.trim().length === 0)) {
        return { error: 'API key is required' };
      }
      if (typeof requirement === 'string' && value?.startsWith(requirement) === false) {
        return { warning: `API key typically starts with "${requirement}"` };
      }
      if (typeof requirement === 'number' && (value?.length ?? 0) < requirement) {
        return {
          warning: `API key appears to be too short (${value?.length === undefined ? '' : String(value.length)} < ${String(requirement)})`,
        };
      }
      return undefined;
    },
  };
}
