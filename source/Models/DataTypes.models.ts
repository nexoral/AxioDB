/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";

// Create an object to hold all Joi types under the name SchemaTypes
export const SchemaTypes = {
  string: Joi.string,
  number: Joi.number,
  boolean: Joi.boolean,
  object: Joi.object,
  array: Joi.array,
  date: Joi.date,
  binary: Joi.binary,
  func: Joi.func,
  ref: Joi.ref,
  any: Joi.any,
  // Add additional types from Joi if needed
  alphanum: Joi.string().alphanum,
  email: Joi.string().email,
  guid: Joi.string().guid,
  ip: Joi.string().ip,
  uri: Joi.string().uri,
  max: (limit: number | Joi.Reference) => Joi.number().max(limit),
  min: (limit: number | Joi.Reference) => Joi.number().min(limit),
  length: (limit: number | Joi.Reference) => Joi.string().length(limit),
  pattern: (regex: RegExp) => Joi.string().pattern(regex),
  required: () => Joi.required(),
  optional: () => Joi.optional(),
  allow: (values: any[]) => Joi.allow(values),
  valid: (values: any[]) => Joi.valid(values),
};
