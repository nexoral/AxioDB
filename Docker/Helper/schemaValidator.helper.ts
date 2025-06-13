/* eslint-disable @typescript-eslint/no-explicit-any */

// This File is for Validating the Schema against the provided data

export default function validateSchema(
  schema: Record<string, string[]>,
  data: Record<string, any>,
): { status: boolean; message?: string } {
  for (const key in schema) {
    const rules = schema[key];
    const value = data[key];

    // Check if required field is missing
    if (rules.includes("required") && (value === undefined || value === null)) {
      return {
        status: false,
        message: `Field '${key}' is required.`,
      };
    }

    // Skip further validation if field is optional and not provided
    if (value === undefined || value === null) {
      continue;
    }

    // Check min length
    const minRule = rules.find((rule) => rule.startsWith("min:"));
    if (minRule) {
      const minLength = parseInt(minRule.split(":")[1], 10);
      if (value.length < minLength) {
        return {
          status: false,
          message: `Field '${key}' must have at least ${minLength} characters.`,
        };
      }
    }

    // Check max length
    const maxRule = rules.find((rule) => rule.startsWith("max:"));
    if (maxRule) {
      const maxLength = parseInt(maxRule.split(":")[1], 10);
      if (value.length > maxLength) {
        return {
          status: false,
          message: `Field '${key}' must have at most ${maxLength} characters.`,
        };
      }
    }

    // Check pattern
    const patternRule = rules.find((rule) => rule.startsWith("pattern:"));
    if (patternRule) {
      const patternString = patternRule.substring(8); // Remove 'pattern:' prefix
      const pattern = new RegExp(patternString);
      if (!pattern.test(value)) {
        return {
          status: false,
          message: `Field '${key}' does not match the required pattern.`,
        };
      }
    }
  }
  return { status: true };
}
