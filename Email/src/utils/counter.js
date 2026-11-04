export function today() {
  return new Date().toISOString().slice(0, 10);
};

export async function readCount(env, key) {
  const raw = await env.EMAIL_KV.get(key);
  if (!raw) return 0;
  const [date, value] = raw.split(':');
  if (date !== today()) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function bumpCount(env, key, current) {
  await env.EMAIL_KV.put(key, `${today()}:${current + 1}`);
};
