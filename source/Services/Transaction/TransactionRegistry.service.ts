/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import { TransactionMetadata } from "../../config/Interfaces/Transaction/transaction.interface";
import FileManager from "../../engine/Filesystem/FileManager";
import FolderManager from "../../engine/Filesystem/FolderManager";
import Converter from "../../Helper/Converter.helper";
import ResponseHelper from "../../Helper/response.helper";

export default class TransactionRegistry {
  private readonly collectionPath: string;
  private readonly registryPath: string;
  private readonly transactionDir: string;
  private readonly FileManager: FileManager;
  private readonly FolderManager: FolderManager;
  private readonly Converter: Converter;
  private readonly ResponseHelper: ResponseHelper;

  constructor(collectionPath: string) {
    this.collectionPath = collectionPath;
    this.transactionDir = `${collectionPath}/.transactions`;
    this.registryPath = `${this.transactionDir}/txn-meta.json`;
    this.FileManager = new FileManager();
    this.FolderManager = new FolderManager();
    this.Converter = new Converter();
    this.ResponseHelper = new ResponseHelper();
  }

  public async registerTransaction(
    metadata: TransactionMetadata
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const dirExists = await this.FolderManager.DirectoryExists(this.transactionDir);
      if (!dirExists.status) {
        await this.FolderManager.CreateDirectory(this.transactionDir);
      }

      const transactions = await this.getAllTransactions();
      transactions.push(metadata);

      const writeResult = await this.FileManager.WriteFile(
        this.registryPath,
        this.Converter.ToString(transactions)
      );

      if (writeResult.status) {
        return this.ResponseHelper.Success({
          message: "Transaction registered",
          transactionId: metadata.transactionId,
        });
      }

      return this.ResponseHelper.Error("Failed to register transaction");
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  public async updateTransactionStatus(
    txnId: string,
    status: 'ACTIVE' | 'PREPARING' | 'COMMITTED' | 'ABORTED'
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      const transactions = await this.getAllTransactions();
      const txnIndex = transactions.findIndex((t) => t.transactionId === txnId);

      if (txnIndex === -1) {
        return this.ResponseHelper.Error("Transaction not found");
      }

      transactions[txnIndex].status = status;

      const writeResult = await this.FileManager.WriteFile(
        this.registryPath,
        this.Converter.ToString(transactions)
      );

      if (writeResult.status) {
        return this.ResponseHelper.Success({
          message: "Transaction status updated",
          transactionId: txnId,
          status,
        });
      }

      return this.ResponseHelper.Error("Failed to update transaction status");
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  public async getActiveTransactions(): Promise<TransactionMetadata[]> {
    try {
      const transactions = await this.getAllTransactions();
      return transactions.filter(
        (t) => t.status === 'ACTIVE' || t.status === 'PREPARING' || t.status === 'COMMITTED'
      );
    } catch {
      return [];
    }
  }

  public async removeTransaction(txnId: string): Promise<SuccessInterface | ErrorInterface> {
    try {
      const transactions = await this.getAllTransactions();
      const filteredTransactions = transactions.filter((t) => t.transactionId !== txnId);

      const writeResult = await this.FileManager.WriteFile(
        this.registryPath,
        this.Converter.ToString(filteredTransactions)
      );

      if (writeResult.status) {
        return this.ResponseHelper.Success({
          message: "Transaction removed",
          transactionId: txnId,
        });
      }

      return this.ResponseHelper.Error("Failed to remove transaction");
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  private async getAllTransactions(): Promise<TransactionMetadata[]> {
    try {
      const fileExists = await this.FileManager.FileExists(this.registryPath);
      if (!fileExists.status) {
        return [];
      }

      const readResult = await this.FileManager.ReadFile(this.registryPath);
      if (!readResult.status) {
        return [];
      }

      const content = readResult.data;
      if (!content || content.trim().length === 0) {
        return [];
      }

      return this.Converter.ToObject(content) as TransactionMetadata[];
    } catch {
      return [];
    }
  }
}
