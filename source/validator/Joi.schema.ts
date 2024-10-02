import joi from 'joi';

export const schema = joi.object({
    name: joi.string().required(),
    age: joi.number().required(),
    email: joi.string().email().required(),
    });


    const { error, value } = schema.validate({ name: 'John', age: 25, email: '