import nodemailer from 'nodemailer';

const host = process.env.EMAIL_HOST || '';
const port = Number(process.env.EMAIL_PORT || 587);
const user = process.env.EMAIL_USER || '';
const pass = process.env.EMAIL_PASS || '';
const fromAddress = process.env.EMAIL_FROM || 'MJ Carros <no-reply@mjcarros.com>';

export const hasEmailConfig = !!(host && user && pass);

export const transporter = hasEmailConfig
  ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  : null;

export async function sendMail(to: string, subject: string, html: string, attachments?: any[]) {
  // Debug log email configuration (without password)
  try {
    const maskedUser = user ? `${user.slice(0, 2)}***@***` : '';
    console.log('[MAIL] Config:', { host, port, user: maskedUser, fromAddress, hasEmailConfig });
    console.log('[MAIL] Sending to:', to, 'subject:', subject);
  } catch {}

  if (!transporter) return { skipped: true } as const;
  await transporter.sendMail({ 
    from: fromAddress, 
    to, 
    subject, 
    html,
    attachments: attachments || []
  });
  return { ok: true } as const;
}
