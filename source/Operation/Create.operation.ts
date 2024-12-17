/* eslint-disable @typescript-eslint/no-explicit-any */
import FileManager from "../Storage/FileManager";
import { ClassBased } from 'outers';
import responseHelper from "../Helper/response.helper";

export default  class Insertion {
    private readonly Operator: FileManager;
    private readonly collectionName: string;
    private readonly data: object | any;

    constructor(collectionName: string, data: object | any) {
        this.Operator = new FileManager();
        this.collectionName = collectionName;
        this.data = data;
    };

    public  async Save(): Promise<any> {
        let isExist;
        let ID;
        do{
            ID = new ClassBased.UniqueGenerator(15).RandomWord(true);
            const response = await  this.Operator.FileExists(`${this.collectionName}/${ID}.json`)
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            response.status ? isExist = true : isExist = false;

        } while(isExist == false);

        const response = await this.Operator.WriteFile(`${this.collectionName}/${ID}.json`, JSON.stringify(this.data));

        if (response.status){
            return await new responseHelper().Success(({
                Message: "Data Saved Successfully",
                Data: {
                    ID,
                    ...this.data
                }
            }))
        }
    }
}