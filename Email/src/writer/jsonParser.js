export function parseVerdict(raw) {
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;

  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) text = text.slice(start, end + 1);

  // Attempt 1: Direct JSON.parse
  try {
    return JSON.parse(text);
  } catch {}

  // Attempt 2: Sanitize raw control characters (\n, \r, \t) inside string literals
  try {
    const cleaned = text.replace(/[\u0000-\u001F]+/g, (match) => {
      if (match.includes('\n')) return '\\n';
      if (match.includes('\r')) return '\\r';
      if (match.includes('\t')) return '\\t';
      return '';
    });
    return JSON.parse(cleaned);
  } catch {}

  // Attempt 3: Robust key-value extraction using regex (handles unescaped internal quotes)
  try {
    const action = (text.match(/"action"\s*:\s*"([^"]+)"/i) || [])[1] || 'REPLY';
    const urgency = (text.match(/"urgency"\s*:\s*"([^"]+)"/i) || [])[1] || 'NORMAL';
    const subject = (text.match(/"subject"\s*:\s*"([^"]+)"/i) || [])[1] || '';

    let bodyText = '';
    const textMatch = text.match(/"text"\s*:\s*"([\s\S]*?)(?="\s*,\s*"(?:html|action|reason|urgency)"|"\s*})/i);
    if (textMatch) {
      bodyText = textMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }

    let bodyHtml = null;
    const htmlMatch = text.match(/"html"\s*:\s*"([\s\S]*?)(?="\s*,\s*"(?:text|action|reason|urgency)"|"\s*})/i);
    if (htmlMatch) {
      bodyHtml = htmlMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }

    if (bodyText || bodyHtml) {
      return { action, urgency, subject, text: bodyText, html: bodyHtml };
    }
  } catch {}

  // Attempt 4: Fallback if model returned plain text or raw HTML without JSON
  if (text.length > 20) {
    const isHtml = text.includes('<p>') || text.includes('<pre>') || text.includes('<code>');
    return {
      action: 'REPLY',
      urgency: 'NORMAL',
      subject: '',
      text: isHtml ? text.replace(/<[^>]*>/g, '') : text,
      html: isHtml ? text : null,
    };
  }

  return null;
}
