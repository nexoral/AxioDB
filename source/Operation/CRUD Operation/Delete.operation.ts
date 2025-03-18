/* eslint-disable @typescript-eslint/no-explicit-any */

import { CryptoHelper } from "../../Helper/Crypto.helper";
import ResponseHelper from "../../Helper/response.helper";


export default class DeleteOperation {
    // Properties
    protected readonly collectionName: string;
    private readonly baseQuery: object | any;
    private readonly path: string;
    private readonly isEncrypted: boolean;
    private readonly encryptionKey: string | undefined;
    private readonly ResponseHelper: ResponseHelper;
    private cryptoInstance?: CryptoHelper;

    constructor(collectionName: string, path: string, baseQuery: object | any, isEncrypted: boolean = false, encryptionKey?: string,) {
        this.collectionName = collectionName;
        this.path = path;
        this.baseQuery = baseQuery;
        this.isEncrypted = isEncrypted;
        this.encryptionKey = encryptionKey;
        this.ResponseHelper = new ResponseHelper();
        if (this.isEncrypted && this.encryptionKey) {
            this.cryptoInstance = new CryptoHelper(this.encryptionKey);
        }
    }

    // Methods
    public async deleteOne() {
        
    }
}