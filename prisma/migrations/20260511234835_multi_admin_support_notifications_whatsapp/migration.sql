-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'BILLING', 'CONTENT', 'VIEWER');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'AWAITING_CLIENT', 'AWAITING_ADMIN', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MessageFrom" AS ENUM ('CLIENT', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ScheduleTrigger" AS ENUM ('ON_USER_SIGNUP', 'ON_TENANT_CREATED', 'ON_FIRST_EVENT', 'ON_SUBSCRIPTION_CREATED', 'ON_TRIAL_STARTED', 'BEFORE_TRIAL_ENDED', 'ON_SUBSCRIPTION_RENEWED', 'BEFORE_SUBSCRIPTION_EXPIRY', 'AFTER_SUBSCRIPTION_EXPIRED', 'ON_PAYMENT_FAILED', 'ON_PAYMENT_SUCCESS', 'ON_TEAM_INVITE', 'ON_PHOTO_UPLOAD_COMPLETE', 'ON_FACE_SEARCH_DONE', 'WEEKLY_DIGEST', 'MONTHLY_DIGEST', 'CUSTOM_CRON');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS', 'IN_APP', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'QUEUED', 'SENT', 'FAILED', 'READ');

-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "siteName" TEXT NOT NULL DEFAULT 'EventFace',
    "siteTagline" TEXT NOT NULL DEFAULT 'منصة معارض الفعاليات الذكية',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "ogImageUrl" TEXT,
    "footerLogoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "contactEmail" TEXT,
    "supportEmail" TEXT,
    "contactPhone" TEXT,
    "whatsappNumber" TEXT,
    "socialLinks" JSONB,
    "customCss" TEXT,
    "customJs" TEXT,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'SUPPORT',
    "permissions" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "invitedBy" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
    "category" TEXT,
    "assignedTo" TEXT,
    "pinnedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3),
    "unreadByClient" INTEGER NOT NULL DEFAULT 0,
    "unreadByAdmin" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fromType" "MessageFrom" NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "fromName" TEXT,
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "adminUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "channels" JSONB NOT NULL,
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "whatsappBody" TEXT,
    "smsBody" TEXT,
    "inAppTitle" TEXT,
    "inAppBody" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "variables" JSONB,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_schedules" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "trigger" "ScheduleTrigger" NOT NULL,
    "triggerData" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "recipientId" TEXT,
    "templateKey" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumberId" TEXT,
    "accessToken" TEXT,
    "businessAccountId" TEXT,
    "webhookSecret" TEXT,
    "testNumber" TEXT,
    "defaultTemplate" TEXT,
    "rateLimitPerMin" INTEGER NOT NULL DEFAULT 80,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "whatsapp_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_clerkUserId_key" ON "admin_users"("clerkUserId");

-- CreateIndex
CREATE INDEX "support_tickets_tenantId_status_idx" ON "support_tickets"("tenantId", "status");

-- CreateIndex
CREATE INDEX "support_tickets_status_priority_idx" ON "support_tickets"("status", "priority");

-- CreateIndex
CREATE INDEX "support_messages_ticketId_idx" ON "support_messages"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_key_key" ON "notification_templates"("key");

-- CreateIndex
CREATE INDEX "notification_schedules_trigger_enabled_idx" ON "notification_schedules"("trigger", "enabled");

-- CreateIndex
CREATE INDEX "notification_logs_tenantId_idx" ON "notification_logs"("tenantId");

-- CreateIndex
CREATE INDEX "notification_logs_recipientId_idx" ON "notification_logs"("recipientId");

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_schedules" ADD CONSTRAINT "notification_schedules_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "notification_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_templateKey_fkey" FOREIGN KEY ("templateKey") REFERENCES "notification_templates"("key") ON DELETE SET NULL ON UPDATE CASCADE;
