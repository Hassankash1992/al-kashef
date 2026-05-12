/**
 * MyFatoorah Payment Gateway integration.
 * Docs: https://docs.myfatoorah.com/
 *
 * Flow:
 *   1. Create Invoice via SendPayment / ExecutePayment
 *   2. Customer is redirected to PaymentURL
 *   3. After payment, MyFatoorah calls our webhook (CallBackUrl)
 *   4. We verify with GetPaymentStatus and update our DB
 */

import { db } from "../db";
import type { Payment } from "@prisma/client";

interface MyFatoorahConfig {
  apiKey: string;
  testMode: boolean;
  baseUrl: string;
}

const TEST_BASE = "https://apitest.myfatoorah.com";
const PROD_BASE = "https://api.myfatoorah.com";

async function getConfig(): Promise<MyFatoorahConfig | null> {
  const cfg = await db.paymentGatewayConfig.findUnique({ where: { provider: "MYFATOORAH" } });
  if (!cfg || !cfg.enabled || !cfg.apiKey) return null;
  return {
    apiKey: cfg.apiKey,
    testMode: cfg.testMode,
    baseUrl: cfg.baseUrl ?? (cfg.testMode ? TEST_BASE : PROD_BASE),
  };
}

interface CreateInvoiceParams {
  amount: number;
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerMobile?: string;
  description: string;
  callbackUrl: string;     // success URL
  errorUrl: string;
  customerReference: string; // our payment id (UUID)
  expiryDate?: string;     // ISO date
  language?: "ar" | "en";
}

interface CreateInvoiceResult {
  ok: boolean;
  invoiceId?: string;
  paymentUrl?: string;
  error?: string;
  raw?: any;
}

export async function createInvoice(params: CreateInvoiceParams): Promise<CreateInvoiceResult> {
  const cfg = await getConfig();
  if (!cfg) return { ok: false, error: "MyFatoorah غير مهيأ — اضبط الإعدادات من لوحة الأدمن" };

  const body = {
    NotificationOption: "LNK",         // Link only (we'll redirect)
    InvoiceValue: params.amount,
    CurrencyIso: params.currency ?? "SAR",
    CustomerName: params.customerName,
    DisplayCurrencyIso: params.currency ?? "SAR",
    MobileCountryCode: "+966",
    CustomerMobile: params.customerMobile,
    CustomerEmail: params.customerEmail,
    CallBackUrl: params.callbackUrl,
    ErrorUrl: params.errorUrl,
    Language: params.language ?? "ar",
    CustomerReference: params.customerReference,
    InvoiceItems: [
      { ItemName: params.description, Quantity: 1, UnitPrice: params.amount },
    ],
    ExpireDate: params.expiryDate,
  };

  try {
    const res = await fetch(`${cfg.baseUrl}/v2/SendPayment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok || !data.IsSuccess) {
      return {
        ok: false,
        error: data.Message || data.ValidationErrors?.[0]?.Error || "فشل إنشاء الفاتورة",
        raw: data,
      };
    }

    return {
      ok: true,
      invoiceId: String(data.Data.InvoiceId),
      paymentUrl: data.Data.InvoiceURL,
      raw: data,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "خطأ في الاتصال بـ MyFatoorah" };
  }
}

interface PaymentStatusResult {
  ok: boolean;
  status?: "PAID" | "PENDING" | "FAILED" | "EXPIRED" | "CANCELLED";
  paymentId?: string;
  paymentMethod?: string;
  amount?: number;
  raw?: any;
  error?: string;
}

export async function getPaymentStatus(invoiceId: string): Promise<PaymentStatusResult> {
  const cfg = await getConfig();
  if (!cfg) return { ok: false, error: "MyFatoorah غير مهيأ" };

  try {
    const res = await fetch(`${cfg.baseUrl}/v2/GetPaymentStatus`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Key: invoiceId, KeyType: "InvoiceId" }),
    });
    const data = await res.json();

    if (!res.ok || !data.IsSuccess) {
      return { ok: false, error: data.Message ?? "فشل التحقق من الحالة", raw: data };
    }

    const status = mapStatus(data.Data.InvoiceStatus);
    const successfulTx = data.Data.InvoiceTransactions?.find((t: any) => t.TransactionStatus === "Succss");

    return {
      ok: true,
      status,
      paymentId: successfulTx?.PaymentId,
      paymentMethod: successfulTx?.PaymentGateway,
      amount: data.Data.InvoiceValue,
      raw: data,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "خطأ في الاتصال" };
  }
}

function mapStatus(mfStatus: string): PaymentStatusResult["status"] {
  switch (mfStatus) {
    case "Paid": return "PAID";
    case "Pending": return "PENDING";
    case "Failed": return "FAILED";
    case "Expired": return "EXPIRED";
    case "Canceled":
    case "Cancelled": return "CANCELLED";
    default: return "PENDING";
  }
}

/**
 * Verify and consume a payment after callback.
 * Updates the Payment row and creates Subscription/Invoice as needed.
 */
export async function consumeCallback(invoiceId: string): Promise<{ ok: boolean; payment?: Payment; error?: string }> {
  const status = await getPaymentStatus(invoiceId);
  if (!status.ok) return { ok: false, error: status.error };

  const payment = await db.payment.findFirst({
    where: { providerInvoiceId: invoiceId, provider: "MYFATOORAH" },
  });
  if (!payment) return { ok: false, error: "Payment not found" };

  const updated = await db.payment.update({
    where: { id: payment.id },
    data: {
      status: status.status === "PAID" ? "PAID" : status.status === "FAILED" ? "FAILED" : "PENDING",
      providerPaymentId: status.paymentId,
      paymentMethod: status.paymentMethod,
      paidAt: status.status === "PAID" ? new Date() : null,
      rawResponse: status.raw,
    },
  });

  return { ok: true, payment: updated };
}
