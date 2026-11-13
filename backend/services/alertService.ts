/**
 * Notification Service for Telegram & Webhook Alerts
 * Sends instant notifications to Admin / Faculty / Counselors
 * on critical business actions:
 *  1. New Student Admission Lead
 *  2. New Mains Answer Copy Submitted for Evaluation
 *  3. New Course / Test Series Enrollment & Payment
 */

export interface LeadAlertPayload {
  fullName: string;
  mobile: string;
  email?: string;
  targetExam?: string;
}

export interface MainsCopyAlertPayload {
  studentName?: string;
  studentEmail?: string;
  testTitle?: string;
  submissionUrl?: string;
}

export interface PaymentAlertPayload {
  studentName?: string;
  studentEmail?: string;
  courseTitle?: string;
  amount?: number;
  orderId?: string;
}

class AlertNotificationService {
  private botToken: string | undefined;
  private chatId: string | undefined;
  private webhookUrl: string | undefined;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  }

  /**
   * Helper to send markdown message to Telegram Bot
   */
  private async sendTelegram(messageText: string): Promise<boolean> {
    const token = this.botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chat = this.chatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chat) {
      // In development or when tokens aren't configured yet, log cleanly
      console.log(`[AlertService] (Telegram Not Configured) Message:\n${messageText}`);
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat,
          text: messageText,
          parse_mode: 'Markdown'
        })
      });
      const data = await res.json();
      return Boolean(data.ok);
    } catch (err: any) {
      console.error('[AlertService] Telegram alert error:', err.message);
      return false;
    }
  }

  /**
   * Helper to dispatch to external webhook (Discord / Slack / CRM Zapier)
   */
  private async dispatchWebhook(event: string, payload: any): Promise<void> {
    const hook = this.webhookUrl || process.env.NOTIFICATION_WEBHOOK_URL;
    if (!hook) return;

    try {
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload
        })
      });
    } catch (err: any) {
      console.warn('[AlertService] Webhook dispatch error:', err.message);
    }
  }

  /**
   * 1. Alert for New Admission Lead / Counselling Request
   */
  async notifyNewLead(lead: LeadAlertPayload): Promise<void> {
    const text = [
      `🚨 *NEW ADMISSION LEAD RECEIVED*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Name:* ${lead.fullName}`,
      `📱 *Mobile:* \`${lead.mobile}\``,
      lead.email ? `📧 *Email:* ${lead.email}` : '',
      `🎯 *Target Exam:* ${lead.targetExam || 'BPSC Civil Services'}`,
      `⏰ *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      `👉 *Action:* Assign to Counselor on Admin CMS`
    ].filter(Boolean).join('\n');

    await this.sendTelegram(text);
    await this.dispatchWebhook('LEAD_CREATED', lead);
  }

  /**
   * 2. Alert for New Mains Answer Copy Submitted for Evaluation
   */
  async notifyMainsSubmission(data: MainsCopyAlertPayload): Promise<void> {
    const text = [
      `📝 *NEW MAINS ANSWER COPY SUBMITTED*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📚 *Test:* ${data.testTitle || 'Mains Answer Writing Test'}`,
      `👤 *Student:* ${data.studentName || 'Enrolled Aspirant'}`,
      data.studentEmail ? `📧 *Email:* ${data.studentEmail}` : '',
      `⏰ *Submitted At:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      `⏳ *SLA Deadline:* 48 Hours for Evaluation`,
      data.submissionUrl ? `🔗 [View Answer Copy PDF](${data.submissionUrl})` : '',
      `👉 *Action:* Open Mains Evaluation CMS to evaluate & assign marks`
    ].filter(Boolean).join('\n');

    await this.sendTelegram(text);
    await this.dispatchWebhook('MAINS_COPY_SUBMITTED', data);
  }

  /**
   * 3. Alert for Course / Test Series Enrollment & Payment
   */
  async notifyPaymentSuccess(payment: PaymentAlertPayload): Promise<void> {
    const amountRs = payment.amount ? (payment.amount > 1000 ? Math.round(payment.amount / 100) : payment.amount) : 0;
    const text = [
      `💰 *NEW PROGRAM ENROLLMENT / PAYMENT*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🎓 *Program:* ${payment.courseTitle || 'BPSC Program'}`,
      `💵 *Amount:* ₹${amountRs}`,
      `👤 *Student:* ${payment.studentName || 'Student'}`,
      payment.studentEmail ? `📧 *Email:* ${payment.studentEmail}` : '',
      payment.orderId ? `🧾 *Order ID:* \`${payment.orderId}\`` : '',
      `⏰ *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
    ].filter(Boolean).join('\n');

    await this.sendTelegram(text);
    await this.dispatchWebhook('PAYMENT_RECEIVED', payment);
  }
}

export const alertService = new AlertNotificationService();
