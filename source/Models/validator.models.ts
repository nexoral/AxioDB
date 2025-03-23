/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi, { Schema } from "joi"; // Ensure to import Joi correctly

/**
 * Validates the provided data against the given Joi schema.
 *
 * @param dataSchema - The Joi schema to validate against.
 * @param data - The data to be validated.
 * @param isUpdate - A boolean flag to indicate if the data is being validated for an update operation.
 * @returns A promise that resolves with the validated data if validation is successful, or rejects with a validation error.
 */
export default async function schemaValidate(
  dataSchema: Schema,
  data: any,
  isUpdate = false,
): Promise<any> {
  if (isUpdate) {
    // For update operations, we allow partial data
    try {
      // Use Joi.object() correctly to wrap the schema and validate data.
      const joiSchema = Joi.object(dataSchema).unknown(true); // Converts the provided schema to a Joi object schema
      return await joiSchema.validateAsync(data); // Validate the actual data against the schema
    } catch (error) {
      return error;
    }
  } else {
    // For create operations, we require all data fields
    try {
      return await dataSchema.validateAsync(data); // Validate the actual data against the schema
    } catch (error) {
      return error;
    }
  }
}
