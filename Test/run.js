const { AxioDB } = require("../lib/config/DB.js");
const key = require("./key.js")


const main = async () => {
  let DbInstances = {};
  let DBs = {};
  let Collections = {};

  // Create multiple DB instances
  for (let i = 0; i < key.Count_To_Loop_DB; i++) {
    const dbInstance = new AxioDB(`MainDB${i}`, `./${key.Data_Dir}`);
    DbInstances[`MainDBInstance${i}`] = dbInstance;
    
    // Create multiple databases within each instance
    for (let j = 0; j < key.Count_To_Loop_DB; j++) {
      const database = await dbInstance.createDB(`TestDB${i}_${j}`);
      DBs[`TestDB${i}_${j}`] = database;
      
      // Create multiple collections within each database
      for (let k = 0; k < key.Count_To_Loop_DB; k++) {
        const collection = await database.createCollection(`TestCollection${i}_${j}_${k}`);
        Collections[`TestCollection${i}_${j}_${k}`] = collection;
      }
    }
  }
}


main().then(() => {
  process.exit(0);
});