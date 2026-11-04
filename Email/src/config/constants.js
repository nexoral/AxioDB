export const AI_KEY = 'ai_runs';
export const RESEND_KEY = 'resend_sends';
export const KB_KEY = 'knowledgebase';
export const KB_URL = 'https://raw.githubusercontent.com/nexoral/AxioDB/main/assets/axiodb-knowledge-base.md';

export const MODELS = {
  DECISION: '@cf/cloudflare/clef-flash',
  WRITERS: {
    LOW: '@cf/meta/llama-3.2-3b-instruct',
    MEDIUM: '@cf/mistralai/mistral-small-3.1-24b-instruct',
    HIGH: '@cf/qwen/qwen2.5-coder-32b-instruct',
  },
};

export const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'what', 'your',
  'how', 'can', 'are', 'not', 'you', 'all', 'any', 'but', 'about', 'more',
  'use', 'does', 'when', 'will', 'was', 'were', 'been', 'there', 'their',
  'which', 'our', 'out', 'into', 'some', 'than', 'them', 'then', 'they',
  'help', 'need', 'please', 'hello', 'hi', 'team', 'axiodb', 'email', 'mail'
]);
