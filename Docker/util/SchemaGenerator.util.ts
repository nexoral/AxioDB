/* eslint-disable @typescript-eslint/no-explicit-any */
import { SchemaTypes } from "axiodb";

/**
 * Defines the structure for schema input.
 * Each key corresponds to a field name and its value is an array.
 * The first element is the type (e.g., "string", "number") followed by validation modifiers.
 */
export type SchemaInput = {
  [key: string]: string[]; // modifiers or [type, ...modifiers]
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
 *
 * @returns A schema object with dynamically built validation rules.
 */
export default function generateSchema(
  input: SchemaInput,
): Record<string, any> {
  const schema: Record<string, any> = {};

  for (const [key, arr] of Object.entries(input)) {
    // treat first element as type if recognized, otherwise default to string
    const first = arr[0];
    const hasType = typeof first === "string" && first in SchemaTypes;
    const typeName = hasType ? first : "string";
    const schemaFunction = SchemaTypes[typeName as keyof typeof SchemaTypes];
    let field: any = (schemaFunction as any)(); // always call builder
    const modifiers = hasType ? arr.slice(1) : arr;

    if (!field) {
      throw new Error(`Unsupported type '${typeName}' for key '${key}'.`);
    }

    for (let i = 0; i < modifiers.length; i++) {
      const mod = modifiers[i];
      if (mod === "required") field = i === 0 ? SchemaTypes.required() : field.required();
      else if (mod === "optional") field = i === 0 ? SchemaTypes.optional() : field.optional();
      else if (mod === "allow:null") field = i === 0 ? SchemaTypes.allow([null]) : field.allow([null]);
      else if (mod.startsWith("min:"))
        field = i === 0 ? SchemaTypes.min(Number(mod.split(":")[1])) : field.min(Number(mod.split(":")[1]));
      else if (mod.startsWith("max:"))
        field = i === 0 ? SchemaTypes.max(Number(mod.split(":")[1])) : field.max(Number(mod.split(":")[1]));
      else if (mod.startsWith("length:"))
        field = i === 0 ? SchemaTypes.length(Number(mod.split(":")[1])) : field.length(Number(mod.split(":")[1]));
      else if (mod.startsWith("pattern:")) {
        const pattern = new RegExp(mod.split(":")[1]);
        field = i === 0 ? SchemaTypes.pattern(pattern) : field.pattern(pattern);
      } else if (mod.startsWith("email")) {
        field = i === 0 ? SchemaTypes.email() : field.email();
      }else if (mod.startsWith("alphanum")) {
        field = i === 0 ? SchemaTypes.alphanum() : field.alphanum();
      } else {
        throw new Error(`Unsupported modifier '${mod}' for key '${key}'.`);
      }
    }

    schema[key] = field;
  }

  return schema;
}
