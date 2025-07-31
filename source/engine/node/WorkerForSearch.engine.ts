/* eslint-disable @typescript-eslint/no-explicit-any */
import { parentPort, workerData } from "worker_threads";
import Searcher from "../../utility/Searcher.utils";

const { chunk, query, isUpdated, aditionalFiled } = workerData;
const result: any[] = [];

let left = 0;
let right = chunk.length - 1;

while (left <= right) {
  const indices = [];

  for (let i = 0; i < 2 && left + i <= right; i++) indices.push(left + i);
  for (let i = 0; i < 2 && right - i > left + 1; i++) indices.push(right - i);

  for (const index of indices) {
    const rawItem = chunk[index];
    const item = aditionalFiled ? rawItem[aditionalFiled] : rawItem;
    if (
      item !== undefined &&
      item !== null &&
      Searcher.matchesQuery(item, query, isUpdated)
    ) {
      result.push(rawItem);
    }
  }

  left += 2;
  right -= 2;
}

if (parentPort) {
  parentPort.postMessage(result);
}
