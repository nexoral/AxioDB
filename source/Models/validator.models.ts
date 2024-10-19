import Joi from "joi";
/**
 * Validates the provided data against the given Joi schema.
 *
 * @param dataSchema - The Joi schema to validate against.
 * @param data - The data to be validated.
 * @returns A promise that resolves with the validated data if validation is successful, or rejects with a validation error.
 */
export default async function schemaValidate(
  dataSchema: Joi.Schema,
  data: unknown,
) {
  return await dataSchema.validateAsync(data);
}
