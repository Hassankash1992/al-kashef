/**
 * Notification dispatcher.
 * Reads templates from DB, renders variables, sends via configured channels.
 */

import { db } from "./db";
import type { NotificationChannel, ScheduleTrigger } from "@prisma/client";

interface NotifyOptions {
  templateKey: string;
  tenantId?: string;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  variables?: Record<string, string | number>;
  channels?: NotificationChannel[]; // override template channels
}

function renderTemplate(template: string | null, variables: Record<string, any> = {}): string {
  if (!template) return "";
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(variables[key] ?? `{{${key}}}`));
}

export async function notify(opts: NotifyOptions): Promise<void> {
  const template = await db.notificationTemplate.findUnique({
    where: { key: opts.templateKey },
  });

  if (!template || !template.enabled) return;

  const channels = (template.channels as Record<string, boolean>) ?? {};
  const enabledChannels = (opts.channels ??
    (Object.entries(channels).filter(([, v]) => v).map(([k]) => k.toUpperCase()))) as NotificationChannel[];

  for (const channel of enabledChannels) {
    let body = "";
    let subject: string | undefined;

    switch (channel) {
      case "EMAIL":
        subject = renderTemplate(template.emailSubject, opts.variables);
        body = renderTemplate(template.emailBody, opts.variables);
        break;
      case "WHATSAPP":
        body = renderTemplate(template.whatsappBody, opts.variables);
        break;
      case "SMS":
        body = renderTemplate(template.smsBody, opts.variables);
        break;
      case "IN_APP":
        subject = renderTemplate(template.inAppTitle, opts.variables);
        body = renderTemplate(template.inAppBody, opts.variables);
        break;
    }

    // Log it (always succeed, actual sending is best-effort)
    const log = await db.notificationLog.create({
      data: {
        tenantId: opts.tenantId,
        recipientId: opts.recipientId,
        templateKey: opts.templateKey,
        channel,
        subject,
        body,
        status: "PENDING",
      },
    });

    // Fire and forget actual send
    sendViaChannel(channel, { ...opts, subject, body, logId: log.id }).catch(console.error);
  }
}

async function sendViaChannel(
  channel: NotificationChannel,
  data: { tenantId?: string; recipientEmail?: string; recipientPhone?: string; subject?: string; body: string; logId: string }
): Promise<void> {
  try {
    switch (channel) {
      case "EMAIL":
        // TODO: Integrate Resend / SendGrid / SMTP based on site settings
        await sendEmail(data.recipientEmail, data.subject, data.body);
        break;
      case "WHATSAPP":
        await sendWhatsApp(data.recipientPhone, data.body);
        break;
      case "SMS":
        await sendSMS(data.recipientPhone, data.body);
        break;
      case "IN_APP":
        // Stored in DB, surfaced via UI
        break;
    }
    await db.notificationLog.update({
      where: { id: data.logId },
      data: { status: "SENT", sentAt: new Date() },
    });
  } catch (err: any) {
    await db.notificationLog.update({
      where: { id: data.logId },
      data: { status: "FAILED", error: err?.message ?? "Unknown error" },
    });
  }
}

async function sendEmail(to?: string, subject?: string, body?: string): Promise<void> {
  if (!to || !body) throw new Error("Missing recipient or body");
  // Stub — wire up Resend / SMTP later
  console.log(`[EMAIL] to=${to} subject=${subject}`);
}

async function sendSMS(to?: string, body?: string): Promise<void> {
  if (!to || !body) throw new Error("Missing recipient or body");
  console.log(`[SMS] to=${to}`);
}

async function sendWhatsApp(to?: string, body?: string): Promise<void> {
  if (!to || !body) throw new Error("Missing recipient or body");

  const config = await db.whatsAppConfig.findUnique({ where: { id: 1 } });
  if (!config?.enabled || !config.accessToken || !config.phoneNumberId) {
    throw new Error("WhatsApp not configured");
  }

  const res = await fetch(`https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WhatsApp API error: ${res.status} ${text}`);
  }
}

/**
 * Trigger fired from app code.
 * Looks up active schedules for this trigger and dispatches notifications.
 */
export async function fireTrigger(
  trigger: ScheduleTrigger,
  context: { tenantId?: string; recipientId?: string; recipientEmail?: string; recipientPhone?: string; variables?: Record<string, any> }
): Promise<void> {
  const schedules = await db.notificationSchedule.findMany({
    where: { trigger, enabled: true },
    include: { template: true },
  });

  for (const schedule of schedules) {
    if (!schedule.template.enabled) continue;
    await notify({
      templateKey: schedule.template.key,
      ...context,
    }).catch(console.error);
  }
}
