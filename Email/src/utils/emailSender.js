import { Resend } from 'resend';
import { RESEND_KEY } from '../config/constants.js';
import { bumpCount } from './counter.js';

export async function forwardToDestination(message, destination, { reason } = {}) {
  if (message.canBeForwarded === false) {
    console.error(`Cannot forward ${message.to} - message.canBeForwarded is false`);
    return;
  }

  try {
    console.log(`Forwarding to ${destination} (${reason || 'unknown'})`);
    await message.forward(destination);
  } catch (error) {
    console.error(`Forward to ${destination} failed (${reason || 'unknown'})`, error);
  }
};

export async function sendReplyEmail(env, { sender, recipient, subject, replyBody, resendSends, resendLimit }) {
  await bumpCount(env, RESEND_KEY, resendSends);
  console.log(`[Step 4: Dispatching Resend] Sending reply to ${sender} (Count: ${resendSends + 1}/${resendLimit})...`);

  const resend = new Resend(env.RESEND_API_KEY);
  await resend.emails.send({
    from: `AxioDB Dev Team <${recipient}>`,
    to: sender,
    subject: subject,
    text: replyBody,
    replyTo: env.REPLY_TO_EMAIL || 'connect@ankan.in',
  });
  console.log(`[Step 4: Complete] Plain text reply successfully sent to ${sender}`);
};
