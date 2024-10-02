import Joi from "joi";
export default async function schemaValidate(
  dataSchema: Joi.Schema,
  data: unknown,
) {
  return await dataSchema.validateAsync(data);
}
