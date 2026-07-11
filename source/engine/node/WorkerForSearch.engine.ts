/* eslint-disable @typescript-eslint/no-explicit-any */
import { parentPort, workerData } from "worker_threads";
import Searcher from "../../utility/Searcher.utils";

const { chunk, query, isUpdated, aditionalFiled } = workerData;

const result: any[] = [];
const chunkLength = chunk.length;

// A plain indexed loop is used deliberately - modern JS engines optimize it better than
// .filter()/.map(), which matters here since this runs per-chunk inside a worker thread.
for (let i = 0; i < chunkLength; i++) {
  const rawItem = chunk[i];
  const item = aditionalFiled ? rawItem[aditionalFiled] : rawItem;

  if (item === undefined || item === null) continue;

  if (Searcher.matchesQuery(item, query, isUpdated)) {
    result.push(rawItem);
  }
}

if (parentPort) {
  parentPort.postMessage(result);
}
