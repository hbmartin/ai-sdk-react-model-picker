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
export type ValidationResult<T> = {
  ok: boolean;
  missingRequired: RequiredStringKeys<T>[];
  extraneous: string[];
  message: string | undefined;
};

export interface ConfigAPI<ConfigObj> {
  optional?: Set<string>;
  required?: Set<string>;
  assert(
    rec: Record<string, string> | undefined
  ): asserts rec is Record<string, string> & StringSlice<ConfigObj>;
  validate(record: Record<string, string>): ValidationResult<ConfigObj>;
}

function formatMessage(missing: readonly string[], extraneous: readonly string[]) {
  const lines: string[] = [];
  if (missing.length > 0) {
    lines.push(`• Missing required: ${missing.join(', ')}`);
  }
  if (extraneous.length > 0) {
    lines.push(`• Extraneous: ${extraneous.join(', ')}`);
  }
  return lines.join('\n');
}

// ---- Factory with informative errors
export function makeConfiguration<ConfigObj extends object>(
  // Compile-time assertion: forbid *required* non-string props in ConfigObj.
  ..._assert: NonStringRequiredKeys<ConfigObj> extends never
    ? []
    : ['ERROR_required_non_string_keys_in_ConfigObj', NonStringRequiredKeys<ConfigObj>]
) {
  return (spec: {
    required?: readonly RequiredStringKeys<ConfigObj>[];
    optional?: readonly OptionalStringKeys<ConfigObj>[];
  }): ConfigAPI<ConfigObj> => {
    const required =
      spec.required === undefined
        ? new Set<string>()
        : new Set<string>(spec.required as readonly string[]);
    const optional =
      spec.optional === undefined
        ? new Set<string>()
        : new Set<string>(spec.optional as readonly string[]);

    function validate(record: Record<string, string>): ValidationResult<ConfigObj> {
      const missingRequired: string[] = [];
      for (const k of required) {
        if (!(k in record)) {
          missingRequired.push(k);
        }
      }

      const extraneous: string[] = [];
      for (const k of Object.keys(record)) {
        if (!required.has(k) && !optional.has(k)) {
          extraneous.push(k);
        }
      }

      const ok = missingRequired.length === 0;

      return {
        ok,
        missingRequired: missingRequired as RequiredStringKeys<ConfigObj>[],
        extraneous,
        message: ok ? undefined : formatMessage(missingRequired, extraneous),
      };
    }

    // Type guard with optional throwing + named context for clearer errors
    function assert(
      record: Record<string, string> | undefined
    ): asserts record is Record<string, string> & StringSlice<ConfigObj> {
      if (record === undefined) {
        if (required.size > 0) {
          throw new Error(
            `Configuration is undefined, but required keys are: ${[...required].join(', ')}`
          );
        }
        return;
      }

      const { ok, message } = validate(record);
      if (!ok) {
        throw new Error(message);
      }
    }

    return {
      assert,
      validate,
      optional,
      required,
    };
  };
}
