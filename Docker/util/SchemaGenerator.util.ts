/* eslint-disable @typescript-eslint/no-explicit-any */
import { SchemaTypes } from "axiodb";

/**
 * Defines the structure for schema input.
 * Each key corresponds to a field name and its value is an array.
 * The first element is the type (e.g., "string", "number") followed by validation modifiers.
 */
export type SchemaInput = {
  [key: string]: [...string[]];
};

/**
 * Dynamically generates a validation schema object using SchemaTypes.
 *
 * @param input - An object where keys are field names and values are arrays
 *                containing the type as the first element followed by validation modifiers.
 *
 * @example
 * ```ts
 * const schema = generateSchema({
 *   username: ['string', 'required', 'min:3', 'max:30'],
 *   email: ['string', 'required', 'email'],
 *   age: ['number', 'min:18', 'default:21']
 * });
 * ```
 * @returns A schema object with dynamically built validation rules.
 */
export default function generateSchema(
  input: SchemaInput,
): Record<string, any> {
  const schema: Record<string, any> = {};

  for (const [key, value] of Object.entries(input)) {
    const [type, ...modifiers] = value;
    const schemaFunction = SchemaTypes[type as keyof typeof SchemaTypes];
    let field = schemaFunction ? (schemaFunction as any)() : null;

    if (!field) {
      throw new Error(`Unsupported type '${type}' for key '${key}'.`);
    }

    for (const mod of modifiers) {
      if (mod === "required") field = field.required();
      else if (mod === "optional") field = field.optional();
      else if (mod === "email") field = field.email();
      else if (mod === "alphanum") field = field.alphanum();
      else if (mod === "trim") field = field.trim();
      else if (mod === "allow:null") field = field.allow(null);
      else if (mod.startsWith("min:"))
        field = field.min(Number(mod.split(":")[1]));
      else if (mod.startsWith("max:"))
        field = field.max(Number(mod.split(":")[1]));
      else if (mod.startsWith("length:"))
        field = field.length(Number(mod.split(":")[1]));
      else if (mod.startsWith("default:")) {
        const val = mod.split(":")[1];
        field = field.default(isNaN(Number(val)) ? val : Number(val));
      } else if (mod.startsWith("valid:")) {
        const vals = mod.split(":")[1].split(",");
        field = field.valid(...vals);
      } else if (mod.startsWith("invalid:")) {
        const vals = mod.split(":")[1].split(",");
        field = field.invalid(...vals);
      } else if (mod.startsWith("pattern:")) {
        const pattern = mod.split(":")[1];
        field = field.pattern(new RegExp(pattern));
      }
    }

    schema[key] = field;
  }

  return schema;
}
