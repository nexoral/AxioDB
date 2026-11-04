export function extractModelResponse(aiResponse) {
  if (!aiResponse) return null;
  if (typeof aiResponse === 'string') return aiResponse;
  if (typeof aiResponse.response === 'string') return aiResponse.response;
  if (Array.isArray(aiResponse.choices) && aiResponse.choices[0]?.message) {
    const msg = aiResponse.choices[0].message;
    if (typeof msg.content === 'string' && msg.content.trim()) return msg.content;
    if (typeof msg.reasoning_content === 'string' && msg.reasoning_content.trim()) return msg.reasoning_content;
    if (typeof msg.reasoning === 'string' && msg.reasoning.trim()) return msg.reasoning;
  }
  if (typeof aiResponse.text === 'string') return aiResponse.text;
  if (typeof aiResponse.result?.response === 'string') return aiResponse.result.response;
  if (typeof aiResponse === 'object') return aiResponse;
  return null;
}
