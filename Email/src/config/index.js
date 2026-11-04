import PostalMime from 'postal-mime';
import { AI_KEY, RESEND_KEY, MODELS } from './constants.js';
import { getFormattedSystemPrompt } from './prompts.js';
import { readCount, bumpCount } from '../utils/counter.js';
import { getKnowledgeBase } from '../rag/knowledgeBase.js';
import { searchVectorlessRAG } from '../rag/vectorlessRag.js';
import { triageEmail } from '../triage/decisionEngine.js';
import { extractModelResponse } from '../writer/modelExtractor.js';
import { parseVerdict } from '../writer/jsonParser.js';
import { forwardToDestination, sendReplyEmail } from '../utils/emailSender.js';

export default {
  async email(message, env, ctx) {
    const destination = env.DESTINATION_EMAIL;
    const aiLimit = Number.parseInt(env.AI_DAILY_LIMIT, 10) || 100;
    const resendLimit = Number.parseInt(env.RESEND_DAILY_LIMIT, 10) || 100;

    const parser = new PostalMime();
    const mail = await parser.parse(message.raw);

    const sender = mail.from?.address || message.from;
    const recipient = message.to || mail.to?.[0]?.address;
    const subject = mail.subject || '(no subject)';
    const body = (mail.text || '').trim().slice(0, 2000);

    console.log(`[Step 0: Received] Mail from: ${sender} | To: ${recipient} | Subject: "${subject}"`);

    // 1. Pre-AI Daily Quota Check
    const aiRuns = await readCount(env, AI_KEY);
    if (aiRuns >= aiLimit) {
      console.warn(`[Step 0: Limit Hit] Daily AI limit reached (${aiRuns}/${aiLimit}). Forwarding to destination.`);
      await forwardToDestination(message, destination, { reason: 'ai-daily-limit-reached' });
      return;
    }

    await bumpCount(env, AI_KEY, aiRuns);
    console.log(`[Step 0: Quota OK] AI Run Count: ${aiRuns + 1}/${aiLimit}`);

    // 2. Step 1: Decision Stage with Clef-Flash (Fast Triage)
    const emailState = `From: ${sender}\nTo: ${recipient}\nSubject: ${subject}\n\n${body || '(empty body)'}`;
    let decision = null;

    try {
      decision = await triageEmail(env, emailState);
    } catch (clefErr) {
      console.error('[Step 1: Clef Failure] Forwarding to destination.', clefErr);
      await forwardToDestination(message, destination, { reason: 'clef-error' });
      return;
    }

    if (!decision || !decision.action) {
      console.error('[Step 1: Clef Failure] No valid decision returned. Forwarding to destination.');
      await forwardToDestination(message, destination, { reason: 'clef-null-decision' });
      return;
    }

    const { action, urgency, modelRoute } = decision;

    // 3. Early Exit on DROP or FORWARD
    if (action === 'DROP') {
      console.log(`[Step 1 Decision: DROP] Spam/automated mail discarded early.`);
      return;
    }

    if (action !== 'REPLY') {
      console.log(`[Step 1 Decision: FORWARD] Reason: ${urgency} priority. Forwarding to ${destination}.`);
      await forwardToDestination(message, destination, {
        reason: `clef-forward-${urgency.toLowerCase()}`,
      });
      return;
    }

    // 4. Pre-Llama Resend Quota Check
    const resendSends = await readCount(env, RESEND_KEY);
    console.log(`[Step 2: Resend Check] Current Resend Count: ${resendSends}/${resendLimit}`);

    if (resendSends >= resendLimit) {
      console.warn(`[Step 2: Resend Limit Hit] Resend quota exhausted (${resendSends}/${resendLimit}). Bypassing generation.`);
      await forwardToDestination(message, destination, { reason: 'resend-daily-limit-reached' });
      return;
    }

    // 5. Step 2: Retrieve Relevant Technical Context via Vectorless RAG
    const kbMarkdown = await getKnowledgeBase(env);
    const queryText = `${subject} ${body}`;
    const relevantContext = searchVectorlessRAG(kbMarkdown, queryText);
    console.log(`[Step 2.5: Vectorless RAG] Relevant context retrieved (${relevantContext.length} characters)`);

    const promptUserContent = relevantContext
      ? `AXIODB TECHNICAL DOCUMENTATION CONTEXT:\n${relevantContext}\n\nINCOMING EMAIL:\n${emailState}`
      : emailState;

    // 6. Step 3: Writer Generation Stage (Multi-Model Router)
    const targetModel = MODELS.WRITERS[modelRoute] || MODELS.WRITERS.LOW;
    console.log(`[Step 3: Writer Routing] Routed to ${modelRoute} -> Generating reply with ${targetModel}...`);

    const systemPromptFormatted = getFormattedSystemPrompt();
    let writerVerdict = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const aiResponse = await env.AI.run(targetModel, {
          messages: [
            { role: 'system', content: systemPromptFormatted },
            { role: 'user', content: promptUserContent },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 1000,
        });

        const rawOutput = extractModelResponse(aiResponse);
        writerVerdict = parseVerdict(rawOutput);

        if (writerVerdict && (writerVerdict.text || writerVerdict.html)) {
          console.log(
            `[Step 3: Writer Success] Model: ${targetModel} | Attempt ${attempt} -> Reply (${(writerVerdict.text || '').length} chars)`
          );
          break;
        }

        if (writerVerdict && writerVerdict.action === 'FORWARD') {
          console.log(`[Step 3: Writer routed to FORWARD] Reason: ${writerVerdict.reason || 'uncertain'}`);
          await forwardToDestination(message, destination, {
            reason: `writer-forward-${(writerVerdict.reason || 'uncertain').replace(/\s+/g, '-').toLowerCase()}`,
          });
          return;
        }

        throw new Error(
          `Unparseable writer response from ${targetModel}: ${(JSON.stringify(aiResponse) || '').slice(0, 1000)}`
        );
      } catch (error) {
        console.warn(`[Step 3: Writer Retry] Attempt ${attempt}/2 failed on ${targetModel}:`, error?.message || error);
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } else {
          console.error(`[Step 3: Writer Permanent Failure] Model ${targetModel} failed. Forwarding to destination.`, error);
          await forwardToDestination(message, destination, { reason: 'writer-error' });
          return;
        }
      }
    }

    // 7. Step 4: Resend Dispatch
    const replyBody = writerVerdict.text || (typeof writerVerdict.html === 'string' ? writerVerdict.html.replace(/<[^>]*>/g, '') : '') || body || '';
    const replySubject = writerVerdict.subject || `Re: ${subject}`;

    await sendReplyEmail(env, {
      sender,
      recipient,
      subject: replySubject,
      replyBody,
      resendSends,
      resendLimit,
    });
  },
};
