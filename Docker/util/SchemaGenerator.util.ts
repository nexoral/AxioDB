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
    // pull off the type name, then the rest are modifiers
    const [typeName, ...modifiers] = value;
    if (!(typeName in SchemaTypes)) {
      throw new Error(`Unsupported type '${typeName}' for key '${key}'.`);
    }
    // initialize field once
    let field: any = (SchemaTypes as any)[typeName]();

    // apply modifiers in order
    for (const mod of modifiers) {
      if (mod === "required") {
        field = field.required();
      } else if (mod === "optional") {
        field = field.optional();
      } else if (mod === "email") {
        field = field.email();
      } else if (mod === "alphanum") {
        field = field.alphanum();
      } else if (mod === "allow:null") {
        field = field.allow([null]);
      } else if (mod.startsWith("min:")) {
        field = field.min(Number(mod.split(":")[1]));
      } else if (mod.startsWith("max:")) {
        field = field.max(Number(mod.split(":")[1]));
      } else if (mod.startsWith("length:")) {
        field = field.length(Number(mod.split(":")[1]));
      } else if (mod.startsWith("pattern:")) {
        const pattern = new RegExp(mod.split(":")[1]);
        field = field.pattern(pattern);
      }
    }

    schema[key] = field;
  }

  return schema;
}