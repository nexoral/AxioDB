/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { SchemaTypes } = require('../lib/config/DB.js')

/* eslint-disable no-undef */
const Data_Dir = 'TestDB'
const Count_To_Loop_DB = 3
const Count_To_Loop_Data = 10000

const Data_To_Insert = {
  name: 'Ankan Saha',
  age: 21
}

const schema = {
  name: SchemaTypes.string().required(),
  age: SchemaTypes.number().required()
}

module.exports = {
  Data_Dir,
  Count_To_Loop_DB,
  Data_To_Insert,
  schema,
  Count_To_Loop_Data
}
