/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi, { Schema } from "joi"; // Ensure to import Joi correctly

/**
 * Validates the provided data against the given Joi schema.
 *
 * @param dataSchema - The Joi schema to validate against.
 * @param data - The data to be validated.
 * @returns A promise that resolves with the validated data if validation is successful, or rejects with a validation error.
 */
export default async function schemaValidate(
  dataSchema: Schema,
  data: any,
): Promise<any> {
  try {
    // Use Joi.object() correctly to wrap the schema and validate data.
    const joiSchema = Joi.object(dataSchema); // Converts the provided schema to a Joi object
    return await joiSchema.validateAsync(data); // Validate the actual data against the schema
  } catch (error) {
    return error;
  }
}
