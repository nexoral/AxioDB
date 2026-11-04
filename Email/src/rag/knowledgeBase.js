import { KB_KEY, KB_URL } from '../config/constants.js';
import { today } from '../utils/counter.js';

export async function getKnowledgeBase(env) {
  const currentDate = today();
  let cached = null;

  try {
    const raw = await env.EMAIL_KV.get(KB_KEY);
    if (raw) {
      cached = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[KB Cache] Error reading/parsing cached knowledge base:', err?.message || err);
  }

  // Daily cache hit: return cached version if fetched today
  if (cached && cached.date === currentDate && typeof cached.markdown === 'string' && cached.markdown.length > 0) {
    console.log(`[KB Cache Hit] Using today's (${currentDate}) knowledge base from KV (${cached.markdown.length} chars)`);
    return cached.markdown;
  }

  // Daily refresh / first mail of the day: fetch from GitHub URL
  console.log(`[KB Fetch] Fetching fresh knowledge base from GitHub for ${currentDate}...`);
  try {
    const response = await fetch(KB_URL, {
      headers: { 'User-Agent': 'AxioDB-Email-Classifier' },
      signal:
        typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
          ? AbortSignal.timeout(6000)
          : undefined,
    });

    if (response.ok) {
      const markdown = await response.text();
      if (markdown && markdown.trim().length > 0) {
        await env.EMAIL_KV.put(KB_KEY, JSON.stringify({ date: currentDate, markdown }));
        console.log(`[KB Fetch Success] Stored fresh knowledge base in KV for ${currentDate} (${markdown.length} chars)`);
        return markdown;
      }
    } else {
      console.warn(`[KB Fetch Warning] GitHub returned HTTP ${response.status}`);
    }
  } catch (fetchError) {
    console.error('[KB Fetch Error] Failed to fetch knowledge base from GitHub:', fetchError?.message || fetchError);
  }

  // Fault-tolerant fallback: use previous cached version if fetch fails
  if (cached && typeof cached.markdown === 'string' && cached.markdown.length > 0) {
    console.warn('[KB Fallback] Falling back to previously cached knowledge base');
    return cached.markdown;
  }

  return '';
}
