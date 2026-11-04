import { MODELS } from '../config/constants.js';

export function extractChoice(obj, fallback = null) {
  if (!obj) return fallback;
  if (typeof obj === 'string') return obj;
  if (obj.choice) return obj.choice;
  if (obj.selected) return obj.selected;
  if (obj.value) return obj.value;
  if (obj.probabilities && typeof obj.probabilities === 'object') {
    const sorted = Object.entries(obj.probabilities).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) return sorted[0][0];
  }
  return fallback;
}

export function parseClefDecision(response) {
  if (!response) return null;
  const answers = response?.result?.answers || response?.answers || response;
  if (!answers || typeof answers !== 'object') return null;

  const action = extractChoice(answers.action);
  const urgency = extractChoice(answers.urgency, 'NORMAL');
  const modelRoute = extractChoice(answers.model_route, 'LOW');

  if (!action) return null;
  return {
    action: String(action).toUpperCase(),
    urgency: String(urgency).toUpperCase(),
    modelRoute: String(modelRoute).toUpperCase(),
  };
}

export async function triageEmail(env, emailState) {
  console.log(`[Step 1: Clef] Starting triage with ${MODELS.DECISION}...`);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const clefResponse = await env.AI.run(MODELS.DECISION, {
        model: 'clef-flash',
        state: emailState,
        questions: {
          action: {
            type: 'choice',
            instructions: 'What action should be taken for this email regarding the AxioDB database?',
            criteria: {
              REPLY: 'A genuine technical question, usage question, or support inquiry about AxioDB that can be answered from documentation.',
              FORWARD: 'Security vulnerability report, data loss risk, legal threat, private account issue, sales inquiry, partnership, non-AxioDB topic, or bug needing private repo.',
              DROP: 'Marketing, newsletters, promotional material, spam, automated system notifications, receipts, or phishing.',
            },
          },
          urgency: {
            type: 'choice',
            instructions: 'What is the urgency level of this email?',
            criteria: {
              CRITICAL: 'Security vulnerability, exploit, 1-day/0-day bug, remote code execution, data loss risk, or legal threat.',
              HIGH: 'Production outage, blocking bug, crash, or urgent customer issue.',
              NORMAL: 'Standard technical question, API usage, or documentation inquiry.',
              LOW: 'Minor technical question, cosmetic feedback, or non-blocking inquiry.',
              PROMOTIONAL: 'Marketing, cold sales pitch, newsletter, automated system notification, spam, or promotional material.',
            },
          },
          model_route: {
            type: 'choice',
            instructions: 'What level of technical model capability is needed to answer this AxioDB inquiry accurately?',
            criteria: {
              NO_ROUTE: 'Email is spam, promotional, automated, or requires human forwarding; no AI reply model is needed.',
              LOW: 'Trivial one-line syntax questions, package installation commands, or basic package version checks.',
              MEDIUM: 'MCP AI agent integration, Docker container deployment, remote TCP access (AxioDBCloud), query operators, indexing strategies, transactions, pagination, runtime compatibility, or troubleshooting errors.',
              HIGH: 'Complex multi-collection aggregation pipelines, concurrency race conditions, custom operator registration (OperatorRegistry), intricate query code debugging, TypeScript typing, or internal engine architecture.',
            },
          },
        },
      });

      const decision = parseClefDecision(clefResponse);
      if (decision && decision.action) {
        console.log(
          `[Step 1: Clef Success] Attempt ${attempt} -> Action: ${decision.action} | Urgency: ${decision.urgency} | Route: ${decision.modelRoute}`
        );
        return decision;
      }
      throw new Error(`Unparseable Clef response: ${(JSON.stringify(clefResponse) || '').slice(0, 300)}`);
    } catch (error) {
      console.warn(`[Step 1: Clef Retry] Attempt ${attempt}/2 failed:`, error?.message || error);
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else {
        throw error;
      }
    }
  }

  return null;
}
