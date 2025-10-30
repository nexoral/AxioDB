/* eslint-disable @typescript-eslint/no-explicit-any */
import { parentPort, workerData } from "worker_threads";
import Searcher from "../../utility/Searcher.utils";

const { chunk, query, isUpdated, aditionalFiled } = workerData;

// Optimized for maximum performance
const result: any[] = [];
const chunkLength = chunk.length;

// Simple linear loop is fastest for this use case
// Modern JS engines optimize simple loops very well
for (let i = 0; i < chunkLength; i++) {
  const rawItem = chunk[i];
  const item = aditionalFiled ? rawItem[aditionalFiled] : rawItem;

  // Skip null/undefined checks with early continue
  if (item === undefined || item === null) continue;

  if (Searcher.matchesQuery(item, query, isUpdated)) {
    result.push(rawItem);
  }
}

if (parentPort) {
  parentPort.postMessage(result);
}
