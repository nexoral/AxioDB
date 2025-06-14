const { AxioDB } = require('../lib/config/DB.js')
const key = require('./key.js')

const main = async () => {
  const DocumentId = []

  // Create multiple DB instances
  for (let i = 0; i < key.Count_To_Loop_DB; i++) {
    const dbInstance = new AxioDB(`MainDB${i}`, `./${key.Data_Dir}`)

    // Create multiple databases within each instance
    for (let j = 0; j < key.Count_To_Loop_DB; j++) {
      const database = await dbInstance.createDB(`TestDB${i}_${j}`)

      // Create multiple collections within each database
      for (let k = 0; k < key.Count_To_Loop_DB; k++) {
        const even = k % 2 === 0
        if (even == true) {
          const collection = await database.createCollection(
            `TestCollection${i}_${j}_${k}`,
            key.schema,
            even,
            'MeyKey'
          )

          // Insert documents
          for (let m = 0; m < key.Count_To_Loop_Data; m++) {
            const Status = await collection.insert(key.Data_To_Insert)
            DocumentId.push(Status.data.documentId)
          }

          // -- new: query a random document and measure time
          const randomIndex = Math.floor(Math.random() * DocumentId.length)
          const randomId = DocumentId[randomIndex]
          console.time('queryTime')
          const queryResult = await collection
            .query({ documentId: randomId })
            .exec()
          console.timeEnd('queryTime')
          console.log(queryResult)
        } else {
          const collection = await database.createCollection(
            `TestCollection${i}_${j}_${k}`,
            key.schema,
            even
          )

          // Insert documents
          for (let m = 0; m < key.Count_To_Loop_Data; m++) {
            const Status = await collection.insert(key.Data_To_Insert)
            DocumentId.push(Status.data.documentId)
          }

          // -- new: query a random document and measure time
          const randomIndex = Math.floor(Math.random() * DocumentId.length)
          const randomId = DocumentId[randomIndex]
          console.time('queryTime')
          const queryResult = await collection
            .query({ documentId: randomId })
            .exec()
          console.timeEnd('queryTime')
          console.log(queryResult)
        }
      }
    }
  }
}

main().then(() => {
  process.exit(0)
})
