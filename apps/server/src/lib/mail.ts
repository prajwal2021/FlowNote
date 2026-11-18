import { publicUrl } from './storage';

interface Mail {
  to: string;
  subject: string;
  text: string;
}

async function send(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) {
    if (process.env.NODE_ENV === 'production') throw new Error('RESEND_API_KEY and MAIL_FROM are required to send email');
    console.info(`[mail] to ${mail.to}: ${mail.subject}\n${mail.text}`);
    return;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text }),
  });
  if (!response.ok) throw new Error(`mail provider returned ${response.status}: ${await response.text()}`);
}

export function sendPasswordReset(to: string, token: string): Promise<void> {
  const link = `${publicUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return send({
    to,
    subject: 'Reset your FlowNote password',
    text: `Someone asked to reset the password for your FlowNote account.\n\nChoose a new password here (the link works for one hour):\n${link}\n\nIf this wasn't you, ignore this email. Your password stays the same.`,
  });
}

export function sendWelcome(to: string): Promise<void> {
  return send({
    to,
    subject: 'Welcome to FlowNote',
    text: `Your FlowNote account is ready.\n\nOpen the FlowNote extension and press Record to make your first guide.\n\nManage your account and plan at ${publicUrl()}/account`,
  });
}
