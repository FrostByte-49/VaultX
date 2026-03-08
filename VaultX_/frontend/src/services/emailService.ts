// src/services/emailService.ts
//
// Web3Forms sends ALL emails to the inbox registered with your access key.
// Get your FREE key at https://web3forms.com → "Create Access Key"
// Add to .env:  VITE_WEB3FORMS_ACCESS_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
//
// How it works:
//   - Web3Forms delivers the email to YOUR registered inbox (the key owner).
//   - The `email` + `name` fields appear in the email body / reply-to, not as To:.
//   - So every notification lands in YOUR inbox with the user's address as context.

const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '';
const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.com';

export type EmailType =
  | 'inactivity_warning'
  | 'grace_period_started'
  | 'assets_released'
  | 'checkin_confirmed'
  | 'test';

export interface EmailResult {
  success: boolean;
  type: EmailType;
  error?: string;
}

interface SendPayload {
  // user's email — shown in body + used as reply-to
  replyTo: string;
  userName: string;
  subject: string;
  body: string;
  type: EmailType;
}

class EmailService {
  isConfigured(): boolean {
    return Boolean(WEB3FORMS_ACCESS_KEY);
  }

  // ── Core sender ─────────────────────────────────────────────────────────────

  private async send(payload: SendPayload): Promise<EmailResult> {
    if (!WEB3FORMS_ACCESS_KEY) {
      const msg =
        'VITE_WEB3FORMS_ACCESS_KEY is not set. Add it to your .env file. Get a free key at https://web3forms.com';
      console.warn('[EmailService]', msg);
      return { success: false, type: payload.type, error: msg };
    }

    // Web3Forms field reference:
    //   access_key  – your key (required)
    //   subject     – email subject line
    //   from_name   – shown as sender name
    //   name        – submitter name (shown in email body)
    //   email       – submitter email (used as reply-to)
    //   message     – email body
    //   botcheck    – honeypot, MUST be empty string
    const formBody = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: payload.subject,
      from_name: 'VaultKeep',
      name: payload.userName || 'VaultKeep User',
      email: payload.replyTo,           // reply-to address in the delivered email
      message: payload.body,
      botcheck: '',                     // ← required, must stay empty
    };

    console.log('[EmailService] Sending:', payload.type, '→ reply-to:', payload.replyTo);

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formBody),
      });

      const json = await res.json();
      console.log('[EmailService] Response:', json);

      if (json.success) {
        console.log(`[EmailService] ✅ "${payload.type}" submitted successfully`);
        return { success: true, type: payload.type };
      }

      // Common failure reasons:
      //   "Invalid Access Key"  → key is wrong / not activated
      //   "Blocked"             → spam detected or account suspended
      const errMsg = json.message ?? JSON.stringify(json);
      console.error('[EmailService] ❌ Submission failed:', errMsg);
      return { success: false, type: payload.type, error: errMsg };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[EmailService] ❌ Network error:', msg);
      return { success: false, type: payload.type, error: msg };
    }
  }

  // ── Templates ────────────────────────────────────────────────────────────────

  async sendCheckInConfirmation(opts: {
    to_email: string;
    to_name: string;
    nextCheckInDue: string;
  }): Promise<EmailResult> {
    return this.send({
      replyTo: opts.to_email,
      userName: opts.to_name,
      type: 'checkin_confirmed',
      subject: `✅ Check-in confirmed — Dead Man Switch timer reset`,
      body: `
User: ${opts.to_name}
Email: ${opts.to_email}
Action: Manual check-in performed

The Dead Man Switch timer has been successfully reset.
Next check-in due by: ${opts.nextCheckInDue}

Dashboard: ${APP_URL}/dead-man-switch
──────────────────────────────
VaultKeep — Protecting Your Digital Legacy
      `.trim(),
    });
  }

  async sendInactivityWarning(opts: {
    to_email: string;
    to_name: string;
    daysRemaining: number;
    inactivityPeriod: number;
  }): Promise<EmailResult> {
    return this.send({
      replyTo: opts.to_email,
      userName: opts.to_name,
      type: 'inactivity_warning',
      subject: `⚠️ Inactivity Warning — ${opts.daysRemaining} days until switch triggers`,
      body: `
User: ${opts.to_name}
Email: ${opts.to_email}
Days remaining: ${opts.daysRemaining} of ${opts.inactivityPeriod}

ACTION REQUIRED: This user has not checked in for ${opts.inactivityPeriod - opts.daysRemaining} days.
The switch will trigger in ${opts.daysRemaining} day${opts.daysRemaining === 1 ? '' : 's'} if no check-in occurs.

Check-in link: ${APP_URL}/dead-man-switch
──────────────────────────────
VaultKeep — Protecting Your Digital Legacy
      `.trim(),
    });
  }

  async sendGracePeriodStarted(opts: {
    to_email: string;
    to_name: string;
    gracePeriodDays: number;
    releaseDate: string;
  }): Promise<EmailResult> {
    return this.send({
      replyTo: opts.to_email,
      userName: opts.to_name,
      type: 'grace_period_started',
      subject: `🔴 URGENT — Grace period started for ${opts.to_name}, assets release on ${opts.releaseDate}`,
      body: `
User: ${opts.to_name}
Email: ${opts.to_email}
Status: GRACE PERIOD ACTIVE

The Dead Man Switch inactivity period has expired.
A ${opts.gracePeriodDays}-day grace period is now running.

Scheduled asset release: ${opts.releaseDate}

Cancel link: ${APP_URL}/dead-man-switch
──────────────────────────────
VaultKeep — Protecting Your Digital Legacy
      `.trim(),
    });
  }

  async sendAssetsReleased(opts: {
    to_email: string;
    to_name: string;
    nomineeCount: number;
  }): Promise<EmailResult> {
    return this.send({
      replyTo: opts.to_email,
      userName: opts.to_name,
      type: 'assets_released',
      subject: `🔓 Assets released — ${opts.to_name}'s vault transferred to nominees`,
      body: `
User: ${opts.to_name}
Email: ${opts.to_email}
Action: Assets released

Vault assets have been transferred to ${opts.nomineeCount} nominee${opts.nomineeCount === 1 ? '' : 's'}.
The grace period expired with no user response.

Dashboard: ${APP_URL}/dead-man-switch
──────────────────────────────
VaultKeep — Protecting Your Digital Legacy
      `.trim(),
    });
  }

  async sendTestEmail(opts: { to_email: string; to_name: string }): Promise<EmailResult> {
    return this.send({
      replyTo: opts.to_email,
      userName: opts.to_name,
      type: 'test',
      subject: `✅ Test — VaultKeep email notifications are working`,
      body: `
This is a test notification from VaultKeep Dead Man Switch.

Triggered by: ${opts.to_name} (${opts.to_email})
Timestamp: ${new Date().toISOString()}

If you received this, your Web3Forms integration is working correctly.

Email notifications are active for:
  • Inactivity warnings (7 days before trigger)
  • Grace period alerts (with cancel link)
  • Check-in confirmations
  • Asset release notices

Dashboard: ${APP_URL}/dead-man-switch
──────────────────────────────
VaultKeep — Protecting Your Digital Legacy
      `.trim(),
    });
  }
}

export const emailService = new EmailService();