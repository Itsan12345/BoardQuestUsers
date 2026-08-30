import nodemailer from 'nodemailer';
import dns from 'dns';

// Force Node.js to resolve IPv4 addresses first to avoid ENETUNREACH on Render/Cloud hosts
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore on Node versions that do not support this API
}

interface SendVerificationEmailOptions {
  email: string;
  name?: string;
  code: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  devCode?: string;
}

/**
 * Sends email via Resend HTTP REST API (port 443 HTTPS) to bypass cloud SMTP port blocks.
 */
async function sendViaResend({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendEmailResult | null> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  if (!resendApiKey) {
    return null;
  }

  try {
    const rawFrom = (process.env.RESEND_FROM || process.env.EMAIL_FROM || 'BoardQuest <noreply@boardquestusers.online>').trim();
    const fromEmail = rawFrom.replace(/^["']|["']$/g, '');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.error?.message || 'Resend HTTP API failed');
    }

    console.log(`\n[BoardQuest] Email successfully delivered via Resend HTTP API to ${to} (ID: ${data.id})\n`);
    return {
      success: true,
      messageId: data.id,
    };
  } catch (err) {
    console.error('Failed to send email via Resend HTTP API:', err);
    return {
      success: process.env.NODE_ENV !== 'production',
      error: err instanceof Error ? err.message : 'Resend API delivery error',
    };
  }
}

/**
 * Checks whether the app is running in a deployed environment (e.g. Render) vs local development / localhost.
 */
function isDeployedEnvironment(): boolean {
  if (process.env.EMAIL_PROVIDER === 'resend') return true;
  if (process.env.EMAIL_PROVIDER === 'gmail') return false;
  return process.env.RENDER === 'true' || process.env.VERCEL === '1' || process.env.IS_DEPLOYED === 'true';
}
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
  const user = (process.env.SMTP_USER || gmailUser)?.trim();
  const pass = (process.env.SMTP_PASS || gmailPass);

  // Custom DNS lookup to strictly enforce IPv4
  const ipv4Lookup = (hostname: string, _options: any, callback: any) => {
    dns.lookup(hostname, { family: 4 }, callback);
  };

  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
      lookup: ipv4Lookup,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    } as any);
  }

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      lookup: ipv4Lookup,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    } as any);
  }

  return null;
}

/**
 * Sends a branded BoardQuest verification code email to the aspirant.
 */
export async function sendVerificationEmail({
  email,
  name,
  code,
}: SendVerificationEmailOptions): Promise<SendEmailResult> {
  const displayName = name ? name.trim() : 'Aspirant';

  const textContent = `Welcome to BoardQuest, ${displayName}! Your 6-digit verification code is: ${code}. This code expires in 10 minutes.`;
  const subject = `[BoardQuest] ${code} is your aspirant verification code`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BoardQuest Aspirant Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 520px; background-color: #111827; border: 1px solid #1f2937; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.7);">
                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #881337 0%, #be123c 50%, #991b1b 100%); padding: 36px 30px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #ffffff; text-transform: uppercase;">
                      BOARDQUEST
                    </div>
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #fecdd3; text-transform: uppercase; margin-top: 4px;">
                      Aspirant Enrollment Verification
                    </div>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 36px 32px 28px 32px; text-align: center;">
                    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #f9fafb;">
                      Welcome, ${displayName}!
                    </h2>
                    <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #9ca3af;">
                      To initialize your BoardQuest expedition and finalize your aspirant account, please use the 6-digit verification code below:
                    </p>

                    <!-- OTP Box -->
                    <div style="background-color: #1f2937; border: 2px dashed #be123c; border-radius: 16px; padding: 24px 16px; margin-bottom: 28px;">
                      <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #fb7185; text-transform: uppercase; margin-bottom: 8px;">
                        One-Time Verification Code
                      </div>
                      <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #ffffff; font-family: 'Courier New', monospace;">
                        ${code}
                      </div>
                      <div style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
                        Expires in <strong style="color: #f43f5e;">10 minutes</strong>
                      </div>
                    </div>

                    <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                      Enter this code on the enrollment page to complete your signup. If you did not initiate this request, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #0d131f; padding: 20px 30px; border-top: 1px solid #1f2937; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #4b5563; letter-spacing: 0.5px;">
                      &copy; ${new Date().getFullYear()} BoardQuest. MedTech Gamified Board Review.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // 1. Deployed System (Render / Cloud): Use Resend HTTP API
  if (isDeployedEnvironment() && process.env.RESEND_API_KEY) {
    const resendResult = await sendViaResend({
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
    });

    if (resendResult) {
      return resendResult;
    }
  }

  // 2. Localhost Development (npm run dev / npm run start): Use Nodemailer Gmail SMTP
  const transporter = createTransporter();

  if (!transporter) {
    console.log('\n======================================================');
    console.log(`[BoardQuest EMAIL VERIFICATION - DEV MODE]`);
    console.log(`Recipient: ${email}`);
    console.log(`Aspirant: ${displayName}`);
    console.log(`Verification Code: ${code}`);
    console.log(`Valid for: 10 minutes`);
    console.log('======================================================\n');
    return {
      success: process.env.NODE_ENV !== 'production',
      devCode: code,
      error: process.env.NODE_ENV === 'production' ? 'Email service not configured on server (missing credentials)' : undefined,
    };
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || '"BoardQuest" <noreply@boardquest.com>';
    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: `[BoardQuest] ${code} is your aspirant verification code`,
      text: `Welcome to BoardQuest, ${displayName}! Your 6-digit verification code is: ${code}. This code expires in 10 minutes.`,
      html: htmlContent,
    });

    console.log(`\n[BoardQuest] Verification email successfully delivered to ${email} (Message ID: ${info.messageId})\n`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Failed to send verification email via transporter:', error);
    // In local dev, still log the code so registration isn't blocked
    console.log('\n======================================================');
    console.log(`[BoardQuest EMAIL VERIFICATION - FALLBACK]`);
    console.log(`Recipient: ${email}`);
    console.log(`Verification Code: ${code}`);
    console.log('======================================================\n');
    return {
      success: process.env.NODE_ENV !== 'production',
      devCode: code,
      error: error instanceof Error ? error.message : 'Failed to send email via SMTP transporter',
    };
  }
}

interface SendPasswordResetEmailOptions {
  email: string;
  name?: string;
  code: string;
}

/**
 * Sends a sophisticated BoardQuest password recovery email with 6-digit OTP code.
 */
export async function sendPasswordResetEmail({
  email,
  name,
  code,
}: SendPasswordResetEmailOptions): Promise<SendEmailResult> {
  const displayName = name ? name.trim() : 'Aspirant';

  const textContent = `Hello ${displayName}, your 6-digit BoardQuest password recovery code is: ${code}. This code expires in 15 minutes.`;
  const subject = `[BoardQuest] ${code} is your password reset code`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BoardQuest Password Recovery</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 520px; background-color: #111827; border: 1px solid #1f2937; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.7);">
                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #881337 0%, #be123c 50%, #991b1b 100%); padding: 36px 30px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #ffffff; text-transform: uppercase;">
                      BOARDQUEST
                    </div>
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #fecdd3; text-transform: uppercase; margin-top: 4px;">
                      Security Protocol • Password Recovery
                    </div>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 36px 32px 28px 32px; text-align: center;">
                    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #f9fafb;">
                      Hello, ${displayName}
                    </h2>
                    <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #9ca3af;">
                      A request was received to reset the credentials for your BoardQuest account. Use the 6-digit recovery code below to set a new password:
                    </p>

                    <!-- OTP Box -->
                    <div style="background-color: #1f2937; border: 2px dashed #be123c; border-radius: 16px; padding: 24px 16px; margin-bottom: 28px;">
                      <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #fb7185; text-transform: uppercase; margin-bottom: 8px;">
                        Password Recovery Code
                      </div>
                      <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #ffffff; font-family: 'Courier New', monospace;">
                        ${code}
                      </div>
                      <div style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
                        Expires in <strong style="color: #f43f5e;">15 minutes</strong>
                      </div>
                    </div>

                    <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                      If you did not request this password reset, you can safely disregard this email. Your current password will remain unchanged.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #0d131f; padding: 20px 30px; border-top: 1px solid #1f2937; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #4b5563; letter-spacing: 0.5px;">
                      &copy; ${new Date().getFullYear()} BoardQuest. MedTech Gamified Board Review.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // 1. Deployed System (Render / Cloud): Use Resend HTTP API
  if (isDeployedEnvironment() && process.env.RESEND_API_KEY) {
    const resendResult = await sendViaResend({
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
    });

    if (resendResult) {
      return resendResult;
    }
  }

  // 2. Localhost Development (npm run dev / npm run start): Use Nodemailer Gmail SMTP
  const transporter = createTransporter();

  if (!transporter) {
    console.log('\n======================================================');
    console.log(`[BoardQuest PASSWORD RESET - DEV MODE]`);
    console.log(`Recipient: ${email}`);
    console.log(`Aspirant: ${displayName}`);
    console.log(`Reset Code: ${code}`);
    console.log(`Valid for: 15 minutes`);
    console.log('======================================================\n');
    return {
      success: process.env.NODE_ENV !== 'production',
      devCode: code,
      error: process.env.NODE_ENV === 'production' ? 'Email service not configured on server (missing credentials)' : undefined,
    };
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || '"BoardQuest Security" <noreply@boardquest.com>';
    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: `[BoardQuest] ${code} is your password reset code`,
      text: `Hello ${displayName}, your 6-digit BoardQuest password recovery code is: ${code}. This code expires in 15 minutes.`,
      html: htmlContent,
    });

    console.log(`\n[BoardQuest] Password reset email successfully delivered to ${email} (Message ID: ${info.messageId})\n`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Failed to send password reset email via transporter:', error);
    // Dev fallback
    console.log('\n======================================================');
    console.log(`[BoardQuest PASSWORD RESET - FALLBACK]`);
    console.log(`Recipient: ${email}`);
    console.log(`Reset Code: ${code}`);
    console.log('======================================================\n');
    return {
      success: process.env.NODE_ENV !== 'production',
      devCode: code,
      error: error instanceof Error ? error.message : 'Failed to send email via SMTP transporter',
    };
  }
}
