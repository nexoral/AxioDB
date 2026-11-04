import { STOP_WORDS } from '../config/constants.js';

export function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_$-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

export function parseMarkdownChunks(markdown) {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const chunks = [];
  let currentTitle = 'General Overview';
  let currentLines = [];

  for (const line of lines) {
    if (/^#{1,3}\s+(.+)/.test(line)) {
      if (currentLines.length > 0) {
        const content = currentLines.join('\n').trim();
        if (content.length > 0) {
          chunks.push({
            title: currentTitle,
            content,
            titleTokens: new Set(tokenize(currentTitle)),
            contentTokens: new Set(tokenize(content)),
          });
        }
      }
      currentTitle = line.replace(/^#{1,3}\s+/, '').trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    const content = currentLines.join('\n').trim();
    if (content.length > 0) {
      chunks.push({
        title: currentTitle,
        content,
        titleTokens: new Set(tokenize(currentTitle)),
        contentTokens: new Set(tokenize(content)),
      });
    }
  }

  return chunks;
}

export function searchVectorlessRAG(markdown, query, maxSections = 4, maxChars = 3500) {
  const chunks = parseMarkdownChunks(markdown);
  if (chunks.length === 0) return '';

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return chunks.slice(0, 1).map((c) => `### ${c.title}\n${c.content}`).join('\n\n');
  }

  const scored = chunks.map((chunk) => {
    let score = 0;
    const titleLower = chunk.title.toLowerCase();
    for (const token of queryTokens) {
      if (chunk.titleTokens.has(token) || titleLower.includes(token)) {
        score += 4.0;
      }
      if (chunk.contentTokens.has(token)) {
        score += 1.0;
      }
    }
    const normalizedScore = score / Math.log(chunk.content.length + 10);
    return { chunk, score: normalizedScore };
  });

  const candidates = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return chunks.slice(0, 1).map((c) => `### ${c.title}\n${c.content}`).join('\n\n');
  }

  // Dynamic Budgeting: accumulate chunks up to maxChars and maxSections, filtering weak matches
  const selected = [];
  let currentChars = 0;
  const topScore = candidates[0].score;

  for (const item of candidates) {
    const chunkLength = item.chunk.content.length;

    // Discard tail chunks that score less than 30% of the top match
    if (selected.length > 0 && item.score < topScore * 0.30) {
      break;
    }

    // Stop if adding this chunk exceeds our character budget (guaranteeing at least 1 section)
    if (selected.length > 0 && currentChars + chunkLength > maxChars) {
      break;
    }

    selected.push(item.chunk);
    currentChars += chunkLength;

    if (selected.length >= maxSections) {
      break;
    }
  }

  return selected
    .map((c) => `### ${c.title}\n${c.content}`)
    .join('\n\n---\n\n');
}
