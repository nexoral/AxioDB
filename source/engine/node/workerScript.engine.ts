/**
 * Inlined Worker Scripts for AxioDB multi-core parallel processing.
 *
 * Using inlined scripts executed via `new Worker(script, { eval: true })` ensures:
 * 1. Self-contained execution with zero disk-path lookups.
 * 2. Bundler compatibility (single-file distribution without missing companion files).
 * 3. Zero file I/O latency on worker initialization.
 */

const MATCHES_QUERY_FN = `
var MAX_REGEX_LENGTH = 512;
function isSafeRegexPattern(pattern) {
  if (typeof pattern !== 'string' || pattern.length === 0 || pattern.length > MAX_REGEX_LENGTH) return false;
  var inClass = false, escaped = false;
  var groups = [];
  for (var i = 0; i < pattern.length; i++) {
    var c = pattern[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\\\') { escaped = true; continue; }
    if (inClass) { if (c === ']') inClass = false; continue; }
    if (c === '[') { inClass = true; continue; }
    if (c === '(') { groups.push(false); continue; }
    if (c === ')') {
      var hasQuant = groups.pop();
      var next = pattern[i + 1];
      var isUnbounded = next === '+' || next === '*';
      if (isUnbounded && hasQuant) return false;
      if ((isUnbounded || hasQuant) && groups.length > 0) {
        groups[groups.length - 1] = true;
      }
      continue;
    }
    if ((c === '+' || c === '*') && groups.length > 0) {
      groups[groups.length - 1] = true;
    }
  }
  return true;
}

function matchesQuery(item, query, isUpdated) {
  if (!query || typeof query !== 'object') return true;
  var keys = Object.keys(query);
  if (keys.length === 0) return true;

  if (Array.isArray(query.$or)) {
    var orMatch = query.$or.some(function(sub) { return matchesQuery(item, sub, isUpdated); });
    if (!orMatch) return false;
  }

  if (Array.isArray(query.$and)) {
    var andMatch = query.$and.every(function(sub) { return matchesQuery(item, sub, isUpdated); });
    if (!andMatch) return false;
  }

  if (Array.isArray(query.$nor)) {
    var norMatch = !query.$nor.some(function(sub) { return matchesQuery(item, sub, isUpdated); });
    if (!norMatch) return false;
  }

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (key === '$or' || key === '$and' || key === '$nor') continue;

    var qv = query[key];
    var itemValue = isUpdated === true && item && item.data ? item.data[key] : (item ? item[key] : undefined);

    if (typeof qv === 'object' && qv !== null) {
      if ('$regex' in qv) {
        if (!qv._compiledRegex) {
          var pattern = qv.$regex;
          if (pattern instanceof RegExp) {
            qv._compiledRegex = pattern;
          } else if (typeof pattern === 'string' && isSafeRegexPattern(pattern)) {
            qv._compiledRegex = new RegExp(pattern, qv.$options || 'i');
          } else {
            return false;
          }
        }
        if (!qv._compiledRegex.test(String(itemValue))) return false;
        continue;
      }

      var hasRange = '$gt' in qv || '$lt' in qv || '$gte' in qv || '$lte' in qv;
      if (hasRange) {
        if (typeof itemValue !== 'number') return false;
        if ('$gt' in qv && !(itemValue > qv.$gt)) return false;
        if ('$lt' in qv && !(itemValue < qv.$lt)) return false;
        if ('$gte' in qv && !(itemValue >= qv.$gte)) return false;
        if ('$lte' in qv && !(itemValue <= qv.$lte)) return false;
        continue;
      }

      if (Array.isArray(qv.$in)) {
        if (qv.$in.indexOf(itemValue) === -1) return false;
        continue;
      }

      if (Array.isArray(qv.$nin)) {
        if (qv.$nin.indexOf(itemValue) !== -1) return false;
        continue;
      }

      if ('$exists' in qv) {
        var exists = itemValue !== undefined && itemValue !== null;
        if (Boolean(qv.$exists) !== exists) return false;
        continue;
      }

      if ('$eq' in qv) {
        if (itemValue !== qv.$eq) return false;
        continue;
      }

      if ('$ne' in qv) {
        if (itemValue === qv.$ne) return false;
        continue;
      }

      if ('$size' in qv) {
        if (!Array.isArray(itemValue) || itemValue.length !== qv.$size) return false;
        continue;
      }

      if (Array.isArray(qv.$all)) {
        if (!Array.isArray(itemValue)) return false;
        var hasAll = qv.$all.every(function(val) { return itemValue.indexOf(val) !== -1; });
        if (!hasAll) return false;
        continue;
      }

      if ('$elemMatch' in qv) {
        if (!Array.isArray(itemValue)) return false;
        var elemMatch = itemValue.some(function(elem) { return matchesQuery(elem, qv.$elemMatch, false); });
        if (!elemMatch) return false;
        continue;
      }

      if ('$not' in qv) {
        var tempDoc = {};
        tempDoc[key] = itemValue;
        var tempQuery = {};
        tempQuery[key] = qv.$not;
        if (matchesQuery(tempDoc, tempQuery, false)) return false;
        continue;
      }

      if ('$type' in qv) {
        var actualType = itemValue === null ? 'null' : (Array.isArray(itemValue) ? 'array' : typeof itemValue);
        if (actualType !== qv.$type) return false;
        continue;
      }
    }

    if (itemValue !== qv) return false;
  }

  return true;
}
`;

const VECTOR_MATH_FN = `
function isValidVector(v, expectedDim) {
  if (!Array.isArray(v) || v.length === 0) return false;
  if (expectedDim !== undefined && expectedDim > 0 && v.length !== expectedDim) return false;
  for (var i = 0; i < v.length; i++) {
    var val = v[i];
    if (typeof val !== 'number' || !Number.isFinite(val)) return false;
  }
  return true;
}

function cosineSimilarity(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  var dot = 0, normA = 0, normB = 0;
  for (var i = 0; i < a.length; i++) {
    var valA = a[i], valB = b[i];
    dot += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }
  if (normA === 0 || normB === 0) return 0;
  var similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(-1, Math.min(1, similarity));
}

function dotProduct(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  var dot = 0;
  for (var i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

function euclideanDistance(a, b) {
  if (a.length !== b.length || a.length === 0) return Infinity;
  var sum = 0;
  for (var i = 0; i < a.length; i++) {
    var diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
`;

/**
 * Worker script for parallel disk-file reading, JSON parsing, and optional query filtering.
 */
export const workerDataLoadScript = `
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs').promises;

${MATCHES_QUERY_FN}
${VECTOR_MATH_FN}

const BATCH_SIZE = 128;

async function processFiles(chunk, basePath, storeFileName, query, vectorConfig) {
  let result = [];
  const hasQuery = Boolean(query && Object.keys(query).length > 0);
  const hasVector = Boolean(vectorConfig && vectorConfig.field && Array.isArray(vectorConfig.vector));
  const targetDim = hasVector ? vectorConfig.vector.length : 0;
  const metric = hasVector && vectorConfig.options && vectorConfig.options.metric ? vectorConfig.options.metric : 'cosine';
  const minScore = hasVector && vectorConfig.options ? vectorConfig.options.minScore : undefined;
  const candidateLimit = hasVector && vectorConfig.candidateLimit ? vectorConfig.candidateLimit : undefined;

  for (let i = 0; i < chunk.length; i += BATCH_SIZE) {
    const batch = chunk.slice(i, i + BATCH_SIZE);
    const filePromises = batch.map(async (fileName) => {
      try {
        const fileContent = await fs.readFile(basePath + '/' + fileName, 'utf-8');
        const parsedData = JSON.parse(fileContent);

        if (hasQuery && !matchesQuery(parsedData, query)) {
          return null;
        }

        if (hasVector) {
          const docVec = (parsedData && typeof parsedData === 'object') ? parsedData[vectorConfig.field] : undefined;
          if (!isValidVector(docVec, targetDim)) {
            return null;
          }

          let score = 0;
          if (metric === 'cosine') {
            score = cosineSimilarity(vectorConfig.vector, docVec);
          } else if (metric === 'dot') {
            score = dotProduct(vectorConfig.vector, docVec);
          } else if (metric === 'euclidean') {
            score = euclideanDistance(vectorConfig.vector, docVec);
          }

          if (metric === 'euclidean') {
            if (minScore !== undefined && score > minScore) {
              return null;
            }
          } else {
            if (minScore !== undefined && score < minScore) {
              return null;
            }
          }

          parsedData._score = Number(score.toFixed(6));
        }

        return storeFileName ? { fileName, data: parsedData } : parsedData;
      } catch (err) {
        return null;
      }
    });

    const batchResults = await Promise.all(filePromises);
    for (let j = 0; j < batchResults.length; j++) {
      const item = batchResults[j];
      if (item !== null) {
        result.push(item);
      }
    }
  }

  if (hasVector && candidateLimit && result.length > candidateLimit) {
    const maxLocalCandidates = Math.max(candidateLimit * 2, 10);
    if (result.length > maxLocalCandidates) {
      if (metric === 'euclidean') {
        result.sort(function(a, b) {
          const scoreA = storeFileName ? a.data._score : a._score;
          const scoreB = storeFileName ? b.data._score : b._score;
          return scoreA - scoreB;
        });
      } else {
        result.sort(function(a, b) {
          const scoreA = storeFileName ? a.data._score : a._score;
          const scoreB = storeFileName ? b.data._score : b._score;
          return scoreB - scoreA;
        });
      }
      result = result.slice(0, maxLocalCandidates);
    }
  }

  return result;
}

if (parentPort) {
  parentPort.on('message', async (msg) => {
    try {
      const items = await processFiles(
        msg.chunk,
        msg.path,
        Boolean(msg.storeFileName),
        msg.query,
        msg.vectorConfig
      );
      parentPort.postMessage({ jobId: msg.jobId, result: items });
    } catch (error) {
      parentPort.postMessage({ jobId: msg.jobId, error: String(error) });
    }
  });
}

if (workerData && workerData.chunk) {
  processFiles(
    workerData.chunk,
    workerData.path,
    Boolean(workerData.storeFileName),
    workerData.query,
    workerData.vectorConfig
  )
    .then((results) => {
      if (parentPort) parentPort.postMessage(results);
    })
    .catch((error) => {
      if (parentPort) parentPort.postMessage({ error: String(error) });
    });
}
`;

/**
 * Worker script for parallel in-memory query filtering across chunked arrays.
 */
export const workerSearchScript = `
const { parentPort, workerData } = require('worker_threads');

${MATCHES_QUERY_FN}

if (workerData && Array.isArray(workerData.chunk)) {
  const chunk = workerData.chunk;
  const query = workerData.query;
  const isUpdated = Boolean(workerData.isUpdated);
  const additionalField = workerData.aditionalFiled || workerData.additionalFiled;
  const result = [];
  const len = chunk.length;

  for (let i = 0; i < len; i++) {
    const rawItem = chunk[i];
    const item = additionalField ? rawItem[additionalField] : rawItem;
    if (item !== undefined && item !== null) {
      if (matchesQuery(item, query, isUpdated)) {
        result.push(rawItem);
      }
    }
  }

  if (parentPort) {
    parentPort.postMessage(result);
  }
}
`;

// Standard alias export for direct single import
export const workerScript = workerDataLoadScript;
export default workerDataLoadScript;
