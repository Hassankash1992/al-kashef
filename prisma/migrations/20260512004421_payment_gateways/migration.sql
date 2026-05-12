-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MYFATOORAH', 'STRIPE', 'MOYASAR', 'TAP', 'PAYTABS', 'HYPERPAY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "payment_gateway_configs" (
    "provider" "PaymentProvider" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "testMode" BOOLEAN NOT NULL DEFAULT true,
    "apiKey" TEXT,
    "publishableKey" TEXT,
    "webhookSecret" TEXT,
    "baseUrl" TEXT,
    "supportedCountries" JSONB,
    "supportedMethods" JSONB,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'SAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "payment_gateway_configs_pkey" PRIMARY KEY ("provider")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "invoiceId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "providerInvoiceId" TEXT,
    "providerPaymentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "paymentMethod" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "paymentUrl" TEXT,
    "errorMessage" TEXT,
    "rawResponse" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payments_tenantId_status_idx" ON "payments"("tenantId", "status");

-- CreateIndex
CREATE INDEX "payments_providerInvoiceId_idx" ON "payments"("providerInvoiceId");
