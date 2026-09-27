import nodemailer, { type Transporter } from "nodemailer";

// Email delivery for passwordless verification codes. Uses SMTP when the
// SMTP_* env vars are set (QQ Mail: smtp.qq.com:465 with an authorization code
// as the password); otherwise falls back to logging the code to the server
// console so the flow is testable without a provider.

let cached: Transporter | null | undefined;

function transporter(): Transporter | null {
  if (cached !== undefined) return cached;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    cached = null;
    return cached;
  }
  const port = Number(process.env.SMTP_PORT ?? 465);
  const secure = (process.env.SMTP_SECURE ?? "true") !== "false";
  cached = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  return cached;
}

/** True when real SMTP is configured; false means dev/console mode. */
export function mailConfigured(): boolean {
  return transporter() !== null;
}

/**
 * Send a verification code. Returns true if it was actually emailed, false if
 * it was only logged to the console (dev mode).
 */
export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  const tx = transporter();
  if (!tx) {
    console.log(`[mailer:dev] verification code for ${email}: ${code}`);
    return false;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  await tx.sendMail({
    from,
    to: email,
    subject: `MediCompass 验证码 ${code}`,
    text: `您的 MediCompass 验证码是 ${code}，10 分钟内有效。如非本人操作请忽略。`,
    html:
      `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;color:#111">` +
      `<p>您的 MediCompass 验证码：</p>` +
      `<p style="font-size:30px;font-weight:700;letter-spacing:6px;margin:12px 0">${code}</p>` +
      `<p style="color:#666">10 分钟内有效。如非本人操作，请忽略本邮件。</p>` +
      `</div>`,
  });
  return true;
}
