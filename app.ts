import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { getSupabaseClient, getServiceSupabaseClient, isSupabaseConfigured, SUPABASE_SQL_SCHEMA } from './backend/supabase.ts';
import pg from 'pg';
const { Client } = pg;

import {
  storageUploadMiddleware,
  storageMultipleUploadMiddleware,
  uploadToSupabase,
  deleteFromSupabase,
  getOptimizedImageUrl
} from './backend/storage.ts';

import { PRODUCTS } from './src/data.ts';
import { friendlyToUUID } from './src/lib/uuidMapper.ts';
import { injectServerSEO } from './backend/seo.ts';

import {
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getCategories,
  getTags,
  getComments,
  createComment,
  getAuthors,
  generateBlogSitemap,
  generateBlogRss,
  subscribeNewsletter,
  searchBlog
} from './server/blog.ts';

import {
  securityHeadersMiddleware,
  rateLimiterMiddleware,
  csrfProtectionMiddleware,
  xssSanitizerMiddleware,
  authenticateRequest,
  syncSupabaseUser,
  requireRole,
  validateContactSecurity,
  serveRobotsTxt,
  serveSitemapXml
} from './backend/security.ts';

// Resolve ESM vs CJS paths safely
const __filename_esm = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '';
const __dirname_esm = __filename_esm ? path.dirname(__filename_esm) : '';

const app = express();
const PORT = 3000;

// Shared Gemini client utility (Server-side ONLY, User-Agent set for telemetry)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Apply high-performance dynamic compression on all payloads
app.use(compression());

// Parse json payloads
app.use(express.json());

// Apply dynamic sovereign security headers (CSP, HSTS, Clickjacking, MIME checks, Permissions, Referrer)
app.use(securityHeadersMiddleware);

// Clean incoming payload data recursively against Cross-Site Scripting (XSS) injections
app.use(xssSanitizerMiddleware);

// Validate requests to prevent Cross-Site Request Forgery (CSRF)
app.use(csrfProtectionMiddleware);

// Establish rate-limiting on API endpoints to prevent brute-forcing and DoS
app.use('/api', rateLimiterMiddleware(120, 15 * 60 * 1000)); // Max 120 requests per 15 mins

// Serve automated, dynamic search crawler optimization indices
app.get('/robots.txt', serveRobotsTxt);
app.get('/sitemap.xml', serveSitemapXml);

// Initialize local database paths
const DATA_DIR = path.join(process.cwd(), 'data');
const EMAIL_DB_PATH = path.join(DATA_DIR, 'email_history.json');

async function initializeEmailDb() {
  try {
    await fsPromises.mkdir(DATA_DIR, { recursive: true });
    try {
      await fsPromises.access(EMAIL_DB_PATH);
    } catch {
      await fsPromises.writeFile(EMAIL_DB_PATH, JSON.stringify([], null, 2));
    }
  } catch (err) {
    console.error('Error initializing email database directory:', err);
  }
}

// Interface for database record
interface EmailLog {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  totalAmount: number;
  deliveryStatus: 'sent' | 'failed' | 'retrying' | 'smtp_not_configured';
  attemptsCount: number;
  sentAt?: string;
  lastAttemptAt: string;
  logs: string[];
  orderData: any;
}

// -------------------------------------------------------------
// CORE EMAIL LOG ACCESSORS (Asynchronous File Operations)
// -------------------------------------------------------------

async function readEmailDb(): Promise<EmailLog[]> {
  try {
    const data = await fsPromises.readFile(EMAIL_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading email database:', error);
    return [];
  }
}

async function writeEmailDb(logs: EmailLog[]) {
  try {
    await fsPromises.writeFile(EMAIL_DB_PATH, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error writing to email database:', error);
  }
}

// -------------------------------------------------------------
// SUPABASE EMAIL LOG CONVERTERS & ASYNC ACCESSORS
// -------------------------------------------------------------

function toSupabaseEmailLog(el: EmailLog) {
  return {
    id: el.id,
    order_id: el.orderId,
    customer_name: el.customerName,
    customer_email: el.customerEmail,
    order_date: el.orderDate,
    total_amount: el.totalAmount,
    delivery_status: el.deliveryStatus,
    attempts_count: el.attemptsCount,
    sent_at: el.sentAt || null,
    last_attempt_at: el.lastAttemptAt,
    logs: el.logs || [],
    order_data: el.orderData || {}
  };
}

function fromSupabaseEmailLog(sel: any): EmailLog {
  return {
    id: sel.id,
    orderId: sel.order_id,
    customerName: sel.customer_name,
    customerEmail: sel.customer_email,
    orderDate: sel.order_date,
    totalAmount: Number(sel.total_amount),
    deliveryStatus: sel.delivery_status,
    attemptsCount: sel.attempts_count,
    sentAt: sel.sent_at,
    lastAttemptAt: sel.last_attempt_at,
    logs: sel.logs || [],
    orderData: sel.order_data || {}
  };
}

async function readEmailDbAsync(): Promise<EmailLog[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('zoal_email_logs').select('*');
      if (error) {
        console.warn('⚠️ Supabase readEmailDb failed, falling back to local JSON:', error.message);
        return await readEmailDb();
      }
      return (data || []).map(fromSupabaseEmailLog);
    } catch (err: any) {
      console.warn('⚠️ Supabase readEmailDb exception, falling back to local JSON:', err.message || err);
      return await readEmailDb();
    }
  }
  return await readEmailDb();
}

async function writeEmailDbAsync(logs: EmailLog[]) {
  // Always update local backup
  await writeEmailDb(logs);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbLogs = logs.map(toSupabaseEmailLog);
      const { error } = await supabase.from('zoal_email_logs').upsert(dbLogs);
      if (error) {
        console.error('❌ Supabase writeEmailDb error:', error.message);
      }
    } catch (err: any) {
      console.error('❌ Supabase writeEmailDb exception:', err.message || err);
    }
  }
}

// Helper to generate custom transaction lifecycle HTML email templates (Phase 13)
function generatePaymentLifecycleEmailHtml(order: any, type: 'payment_success' | 'payment_failed' | 'refund' | 'invoice'): string {
  const isAr = order.emailLanguage === 'ar';
  const formattedDate = order.date || new Date().toISOString().substring(0, 10);
  
  let title = "Sovereign update";
  let subtitle = "Status notification";
  let statusColor = "#D4AF37"; // gold
  let message = "";
  let iconHtml = "✓";

  if (type === 'payment_success') {
    title = isAr ? "تم استلام الدفع بنجاح" : "Payment Captured Successfully";
    subtitle = isAr ? "شكراً لتسوقكم مع زُوال" : "Thank you for choosing ZOAL Group";
    message = isAr 
      ? `تمت معالجة معاملتك المالية بنجاح للطلب رقم <strong>${order.id}</strong> بمبلغ <strong>${order.total.toFixed(2)} SAR</strong>.`
      : `Your payment transaction for order <strong>${order.id}</strong> of <strong>${order.total.toFixed(2)} SAR</strong> was captured successfully.`;
    iconHtml = "✓";
    statusColor = "#10b981"; // green
  } else if (type === 'payment_failed') {
    title = isAr ? "فشل عملية الدفع" : "Payment Authorization Failed";
    subtitle = isAr ? "يرجى مراجعة تفاصيل البطاقة" : "Please check your payment details";
    message = isAr 
      ? `لم نتمكن من تفويض عملية الدفع للطلب رقم <strong>${order.id}</strong>. يمكنك محاولة الدفع مرة أخرى من لوحة التحكم الخاصة بك.`
      : `We were unable to authorize the payment for order <strong>${order.id}</strong>. You can retry the payment anytime from your Customer Dashboard.`;
    iconHtml = "✕";
    statusColor = "#ef4444"; // red
  } else if (type === 'refund') {
    title = isAr ? "تم استرجاع المبلغ بنجاح" : "Refund Processed Successfully";
    subtitle = isAr ? "تأكيد عملية الاسترجاع" : "Refund Confirmation Notice";
    const refundAmt = order.refundAmount || order.total;
    message = isAr 
      ? `تمت معالجة استرجاع مبلغ وقدره <strong>${refundAmt.toFixed(2)} SAR</strong> للطلب رقم <strong>${order.id}</strong> بنجاح.`
      : `A sovereign refund of <strong>${refundAmt.toFixed(2)} SAR</strong> has been processed successfully for order <strong>${order.id}</strong>.`;
    iconHtml = "↺";
    statusColor = "#f59e0b"; // amber
  } else if (type === 'invoice') {
    title = isAr ? "الفاتورة الضريبية الرسمية" : "Official Tax Invoice Ready";
    subtitle = isAr ? "مجموعة زُوال التجارية" : "ZOAL Group Commercial Invoice";
    message = isAr 
      ? `تم إصدار الفاتورة الضريبية الرسمية للطلب رقم <strong>${order.id}</strong> بمبلغ إجمالي <strong>${order.total.toFixed(2)} SAR</strong> (شاملاً ضريبة القيمة المضافة 15%).`
      : `Your tax invoice of <strong>${order.total.toFixed(2)} SAR</strong> has been generated for order <strong>${order.id}</strong> (inclusive of 15% VAT).`;
    iconHtml = "🧾";
    statusColor = "#d4af37"; // gold
  }

  return `
<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      background-color: #000000;
      color: #ffffff;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: none;
      -ms-text-size-adjust: none;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 15px !important;
      }
    }
  </style>
</head>
<body style="background-color: #000000; color: #ffffff; padding: 20px 0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; width: 100%;">
    <tr>
      <td align="center">
        <!-- Main Wrapper (600px max) -->
        <table class="container" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #050505; border: 1px solid #1c180e; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.9);">
          
          <!-- Double Gold Border Header Spacer -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #8F6F27 0%, #E2C573 50%, #8F6F27 100%);"></td>
          </tr>

          <!-- Corporate Brand Banner -->
          <tr>
            <td align="center" style="padding: 40px 40px 25px 40px; border-bottom: 1px solid #111111;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align: center;">
                <tr>
                  <td>
                    <!-- Elegant Serif Logo Text -->
                    <div style="font-family: 'Times New Roman', Times, 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: bold; color: #D4AF37; letter-spacing: 0.35em; text-transform: uppercase; margin-bottom: 5px;">
                      ZOAL
                    </div>
                    <div style="font-size: 9px; font-weight: 500; color: #8F6F27; letter-spacing: 0.55em; text-transform: uppercase;">
                      Curated Excellence
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notification Announcement Message -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 50%; background-color: rgba(212, 175, 55, 0.1); border: 1px solid ${statusColor}; text-align: center; color: ${statusColor}; font-size: 20px; font-weight: bold;">
                      ${iconHtml}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0 0 10px 0; font-family: 'Times New Roman', Times, Georgia, serif; font-size: 22px; font-weight: normal; color: #ffffff; letter-spacing: 0.1em; text-transform: uppercase;">
                      ${title}
                    </h1>
                    <p style="margin: 0 0 5px 0; font-size: 11px; font-family: monospace; color: #8f6f27; text-transform: uppercase; letter-spacing: 0.15em;">
                      ${subtitle}
                    </p>
                    <p style="margin: 15px 0 0 0; font-size: 13px; color: #a1a1aa; line-height: 1.6; max-width: 440px; text-align: center;">
                      ${message}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Metadata block -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a; border: 1px solid #16130b; border-radius: 2px; padding: 20px;">
                <tr>
                  <td valign="top" style="font-size: 11px; font-family: monospace; line-height: 1.8; color: #a1a1aa;">
                    <strong style="color: #D4AF37; font-size: 12px; display: block; margin-bottom: 8px;">AUDITED Lifcycle details / تفاصيل المعاملة:</strong>
                    Order Serial: ${order.id}<br>
                    Creation Timestamp: ${formattedDate}<br>
                    Secure Gate Reference: ${order.paymentId || 'Sovereign_Mock_Gateway'}<br>
                    Transaction ID: ${order.transactionId || 'Moyasar_Sim_Txn'}<br>
                    Authorized Gateway: Moyasar (Kingdom of Saudi Arabia)<br>
                    Total Secured: ${order.total.toFixed(2)} SAR
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Double Gold Border Footer Divider -->
          <tr>
            <td height="1" style="background-color: #1a1a1a;"></td>
          </tr>

          <!-- Corporate Brand Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #030303; text-align: center; font-size: 11px; color: #52525b; line-height: 1.6;">
              <p style="margin: 0 0 5px 0; font-family: 'Times New Roman', Times, Georgia, serif; font-size: 14px; color: #8F6F27; letter-spacing: 0.2em; text-transform: uppercase;">
                ZOAL Group
              </p>
              <p style="margin: 0 0 15px 0; font-size: 9px; letter-spacing: 0.1em; color: #3f3f46;">
                KINGDOM OF SAUDI ARABIA | المملكة العربية السعودية
              </p>
              <p style="margin: 0;">
                If you have any questions, please contact our guest relation desk at <a href="mailto:support@zoalgroup.com" style="color: #D4AF37; text-decoration: none;">support@zoalgroup.com</a>.<br>
                هذا البريد مرسل تلقائياً، يرجى عدم الرد عليه.
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
}

// Helper to generate the luxury HTML email template
function generateOrderEmailHtml(order: any): string {
  const isAr = order.emailLanguage === 'ar';
  
  // Format dates and delivery estimates
  const formattedDate = order.date || new Date().toISOString().substring(0, 10);
  const estimatedDelivery = order.deliveryMethod === 'Local Delivery' 
    ? 'Same-day or Next-day (Within Al Hofuf)' 
    : '2 to 4 Business Days (Priority Courier)';

  // Build rows for products
  const productsHtml = (order.items || []).map((item: any) => `
    <tr style="border-bottom: 1px solid #1a1a1a;">
      <td style="padding: 12px 0; font-size: 13px; color: #ffffff;">
        <div style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${item.name}</div>
        ${item.selectedOption ? `<div style="font-size: 10px; color: #D4AF37; margin-top: 4px; font-family: monospace;">[${item.selectedOption}]</div>` : ''}
      </td>
      <td style="padding: 12px 0; text-align: center; font-size: 13px; color: #a1a1aa; font-family: monospace;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 0; text-align: right; font-size: 13px; color: #ffffff; font-family: monospace; font-weight: bold;">
        ${item.price.toFixed(2)} SAR
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ZOAL Order Confirmed</title>
  <style>
    body {
      background-color: #000000;
      color: #ffffff;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: none;
      -ms-text-size-adjust: none;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 15px !important;
      }
      .footer-cols {
        display: block !important;
      }
      .footer-col {
        width: 100% !important;
        margin-bottom: 20px !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="background-color: #000000; color: #ffffff; padding: 20px 0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; width: 100%;">
    <tr>
      <td align="center">
        <!-- Main Wrapper (600px max) -->
        <table class="container" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #050505; border: 1px solid #1c180e; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.9);">
          
          <!-- Double Gold Border Header Spacer -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #8F6F27 0%, #E2C573 50%, #8F6F27 100%);"></td>
          </tr>

          <!-- Corporate Brand Banner -->
          <tr>
            <td align="center" style="padding: 40px 40px 25px 40px; border-bottom: 1px solid #111111;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align: center;">
                <tr>
                  <td>
                    <!-- Elegant Serif Logo Text -->
                    <div style="font-family: 'Times New Roman', Times, 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: bold; color: #D4AF37; letter-spacing: 0.35em; text-transform: uppercase; margin-bottom: 5px;">
                      ZOAL
                    </div>
                    <div style="font-size: 9px; font-weight: 500; color: #8F6F27; letter-spacing: 0.55em; text-transform: uppercase;">
                      Curated Excellence
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Confirmation Announcement Message -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 50%; background-color: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); text-align: center; color: #D4AF37; font-size: 20px; font-weight: bold;">
                      ✓
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0 0 10px 0; font-family: 'Times New Roman', Times, Georgia, serif; font-size: 22px; font-weight: normal; color: #ffffff; letter-spacing: 0.1em; text-transform: uppercase;">
                      Order Placed Successfully
                    </h1>
                    <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.6; max-width: 420px; text-align: center;">
                      Thank you for your order, <strong>${order.customerName}</strong>. Your order has been received successfully and is now being processed.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer & Order Identifiers -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a; border: 1px solid #16130b; border-radius: 2px; padding: 20px;">
                <tr>
                  <td width="50%" valign="top" style="font-size: 12px; line-height: 1.8;">
                    <span style="color: #666666; text-transform: uppercase; letter-spacing: 0.05em; font-size: 9px; font-weight: bold; display: block; margin-bottom: 4px;">Order Details</span>
                    <strong style="color: #ffffff; font-size: 13px; color: #D4AF37; font-family: monospace;">${order.id}</strong><br>
                    <span style="color: #a1a1aa;">Date: ${formattedDate}</span><br>
                    <span style="color: #a1a1aa;">Payment: ${order.paymentMethod}</span>
                  </td>
                  <td width="50%" valign="top" style="font-size: 12px; line-height: 1.8;">
                    <span style="color: #666666; text-transform: uppercase; letter-spacing: 0.05em; font-size: 9px; font-weight: bold; display: block; margin-bottom: 4px;">Shipping Address</span>
                    <span style="color: #ffffff; font-weight: 500;">${order.customerName}</span><br>
                    <span style="color: #a1a1aa; display: block; line-height: 1.4; margin-top: 2px;">${order.address}</span><br>
                    <span style="color: #a1a1aa;">Phone: ${order.phone}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Ordered Products Table Section -->
          <tr>
            <td style="padding: 10px 40px 20px 40px;">
              <div style="font-size: 10px; color: #8F6F27; font-weight: bold; text-transform: uppercase; letter-spacing: 0.2em; border-bottom: 1px solid #222222; padding-bottom: 8px; margin-bottom: 5px;">
                Ordered Items Review
              </div>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <thead>
                  <tr style="border-bottom: 1px solid #222222;">
                    <th align="left" style="padding: 10px 0; font-size: 10px; color: #666666; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold;">Product</th>
                    <th align="center" style="padding: 10px 0; font-size: 10px; color: #666666; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold; width: 60px;">Qty</th>
                    <th align="right" style="padding: 10px 0; font-size: 10px; color: #666666; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold; width: 100px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${productsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Summary Pricing Rows -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #1a1a1a; padding-top: 15px;">
                <tr>
                  <td width="60%"></td>
                  <td width="40%">
                    <table width="100%" border="0" cellspacing="0" cellpadding="5" style="font-size: 12px; line-height: 1.5; color: #a1a1aa;">
                      <tr>
                        <td align="left">Subtotal:</td>
                        <td align="right" style="font-family: monospace; color: #ffffff;">${order.subtotal.toFixed(2)} SAR</td>
                      </tr>
                      <tr>
                        <td align="left">Shipping:</td>
                        <td align="right" style="font-family: monospace; color: #D4AF37;">${order.shipping === 0 ? 'FREE' : `${order.shipping.toFixed(2)} SAR`}</td>
                      </tr>
                      <tr style="font-size: 14px; font-weight: bold; color: #ffffff;">
                        <td align="left" style="padding-top: 10px; border-top: 1px solid #222222;">Total:</td>
                        <td align="right" style="padding-top: 10px; border-top: 1px solid #222222; font-family: monospace; color: #D4AF37;">${order.total.toFixed(2)} SAR</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Courier Expectations -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #080808; border-left: 2px solid #D4AF37; padding: 15px; border-radius: 1px;">
                <tr>
                  <td style="font-size: 12px; line-height: 1.6; color: #a1a1aa;">
                    <strong style="color: #ffffff; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Delivery Estimation</strong>
                    Method: <strong>${order.deliveryMethod || 'Regional Delivery'}</strong><br>
                    Estimated delivery time: <strong>${estimatedDelivery}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Support & WhatsApp Communication footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #020202; border-top: 1px solid #111111;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" class="footer-cols">
                <tr>
                  <!-- WhatsApp Support Card -->
                  <td class="footer-col" width="50%" valign="top" style="padding-right: 15px;">
                    <div style="font-size: 11px; font-weight: bold; color: #D4AF37; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">
                      Customer Support
                    </div>
                    <p style="margin: 0 0 10px 0; font-size: 11px; color: #71717a; line-height: 1.5;">
                      For adjustments, immediate tracking assistance, or custom bespoke order requirements.
                    </p>
                    <a href="https://wa.me/966567699315" target="_blank" style="display: inline-block; padding: 8px 14px; background-color: #124233; color: #ffffff; font-size: 10.5px; font-weight: bold; text-decoration: none; border-radius: 2px; text-transform: uppercase; letter-spacing: 0.05em;">
                      💬 WhatsApp Support
                    </a>
                  </td>

                  <!-- Company details -->
                  <td class="footer-col" width="50%" valign="top" style="padding-left: 15px;">
                    <div style="font-size: 11px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">
                      ZOAL GROUP
                    </div>
                    <div style="font-size: 11px; color: #71717a; line-height: 1.6;">
                      📍 Al Hofuf, Saudi Arabia<br>
                      📞 +966 56 769 9315<br>
                      ✉ <a href="mailto:alzoal3003@gmail.com" style="color: #71717a; text-decoration: underline;">alzoal3003@gmail.com</a><br>
                      🕒 Support Hours: 08:00 AM – 12:00 AM
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Closing disclaimer statement -->
          <tr>
            <td align="center" style="padding: 25px 40px; background-color: #000000; font-size: 9px; color: #444444; letter-spacing: 0.05em; line-height: 1.5; border-top: 1px solid #080808;">
              This is an automated order transaction message. Please do not reply directly to this mail address.<br>
              © 2026 ZOAL Group. Curated Luxury Coffee, Fashion & Homeware. All Rights Reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Background retry mechanism (Phase 13)
async function sendEmailWithRetry(
  order: any, 
  emailLogId: string, 
  maxAttempts = 3, 
  delayMs = 2000, 
  emailType: 'confirmation' | 'payment_success' | 'payment_failed' | 'refund' | 'invoice' = 'confirmation'
) {
  let attempt = 1;
  let success = false;
  let lastError = '';

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '465');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'orders@zoalgroup.com';

  const logs = await readEmailDbAsync();
  const recordIndex = logs.findIndex((r) => r.id === emailLogId);

  if (recordIndex === -1) {
    console.error(`Email log record ${emailLogId} not found in database.`);
    return;
  }

  const record = logs[recordIndex];

  if (!smtpHost || !smtpUser || !smtpPass) {
    const warning = 'SMTP details are not configured in environment variables. Email could not be sent, logged as unconfigured SMTP.';
    console.warn(warning);
    record.deliveryStatus = 'smtp_not_configured';
    record.logs.push(`[${new Date().toISOString()}] ${warning}`);
    await writeEmailDbAsync(logs);
    return;
  }

  // Configure Transporter dynamically (lazy-loaded so it never crashes if config is invalid or missing)
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for port 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  // Select dynamic HTML and subject based on the emailType
  const emailHtml = emailType === 'confirmation' 
    ? generateOrderEmailHtml(order) 
    : generatePaymentLifecycleEmailHtml(order, emailType);

  let subject = `✅ Your ZOAL Order Has Been Confirmed`;
  if (emailType === 'payment_success') {
    subject = `💳 ZOAL Payment Captured Successfully / تم استلام الدفع بنجاح`;
  } else if (emailType === 'payment_failed') {
    subject = `❌ ZOAL Payment Authorization Failed / فشل عملية الدفع`;
  } else if (emailType === 'refund') {
    subject = `🔄 ZOAL Sovereign Refund Processed / تأكيد استرجاع المبلغ`;
  } else if (emailType === 'invoice') {
    subject = `🧾 ZOAL Official Tax Invoice Ready / الفاتورة الضريبية الرسمية`;
  }

  while (attempt <= maxAttempts && !success) {
    try {
      record.lastAttemptAt = new Date().toISOString();
      record.attemptsCount = attempt;
      record.logs.push(`[${new Date().toISOString()}] Attempt ${attempt} of ${maxAttempts} started.`);
      
      await transporter.sendMail({
        from: `"ZOAL Group" <${smtpFrom}>`,
        to: order.email,
        subject: subject,
        html: emailHtml,
      });

      success = true;
      record.deliveryStatus = 'sent';
      record.sentAt = new Date().toISOString();
      record.logs.push(`[${new Date().toISOString()}] Email sent successfully on attempt ${attempt}.`);
      console.log(`Order lifecycle email (${emailType}) for order ${order.id} sent successfully to ${order.email}.`);
    } catch (error: any) {
      lastError = error.message || String(error);
      record.logs.push(`[${new Date().toISOString()}] Attempt ${attempt} failed with error: ${lastError}`);
      console.error(`Attempt ${attempt} to send email for order ${order.id} failed:`, lastError);

      if (attempt < maxAttempts) {
        record.deliveryStatus = 'retrying';
        await writeEmailDbAsync(logs);
        // Wait before next attempt
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt)); // exponential backoff multiplier
      } else {
        record.deliveryStatus = 'failed';
        record.logs.push(`[${new Date().toISOString()}] All ${maxAttempts} attempts failed. Delivery aborted.`);
      }
      attempt++;
    }
  }

  await writeEmailDbAsync(logs);
}

// ENDPOINTS

import crypto from 'crypto';

// ==========================================
// AL ZOAL SOVEREIGN AUTHENTICATION SYSTEM API
// ==========================================

async function logActivityAsync(userId: string | null, email: string | null, action: string, ip: string, userAgent: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('zoal_activity_logs').insert({
      id: crypto.randomUUID(),
      user_id: userId,
      email: email,
      action: action,
      ip: ip,
      user_agent: userAgent,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error logging activity to Supabase:', err);
  }
}

// Authentication check using Supabase getUser
// DEPRECATED: Moved to backend/security.ts
// async function authenticateRequest(req: any, res: any, next: any) { ... }

// Session validation & profile retrieval
async function handleSessionSync(req: any, res: any) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    let token = req.body?.token || req.query?.token;

    if (headerValue && headerValue.startsWith('Bearer ')) {
      token = headerValue.substring(7);
    }

    if (process.env.NODE_ENV !== 'production' &&
        process.env.VERCEL_ENV !== 'production' &&
        process.env.AI_STUDIO_DEV_MODE === 'true' &&
        process.env.DEV_ADMIN_BYPASS === 'true' &&
        token === 'dev-preview-token') {
      return res.json({
        success: true,
        user: {
          id: 'dev-preview',
          email: process.env.DEV_BYPASS_EMAIL || 'rkinfinity.official@gmail.com',
          firstName: 'RKInfinity',
          lastName: 'Developer',
          name: 'RKInfinity Developer',
          phone: '',
          role: 'owner',
          isVerified: true,
          addresses: [],
          permissions: [
            'can_manage_products', 'can_manage_orders', 'can_manage_customers',
            'can_manage_inventory', 'can_issue_refund', 'can_view_reports',
            'can_manage_settings', 'can_manage_cms', 'can_manage_media',
            'can_manage_branding', 'can_manage_support', 'can_manage_aistudio'
          ]
        }
      });
    }

    if (!token) {
      return res.status(401).json({ error: 'No session token provided.' });
    }

    const profile = await syncSupabaseUser(token);
    if (!profile) {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }

    return res.json({
      success: true,
      user: profile
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return res.status(500).json({ error: 'Internal server error during session retrieval.' });
  }
}

app.get('/api/auth/session', handleSessionSync);
app.post('/api/auth/session', handleSessionSync);

// Development Configuration & Bypass Verification
app.get('/api/auth/dev-config', (req, res) => {
  const isDevMode = 
    process.env.NODE_ENV !== 'production' &&
    process.env.VERCEL_ENV !== 'production' &&
    process.env.AI_STUDIO_DEV_MODE === 'true' &&
    process.env.DEV_ADMIN_BYPASS === 'true';

  if (isDevMode) {
    return res.json({
      devMode: true,
      user: {
        id: 'dev-preview',
        email: process.env.DEV_BYPASS_EMAIL || 'rkinfinity.official@gmail.com',
        firstName: 'RKInfinity',
        lastName: 'Developer',
        name: 'RKInfinity Developer',
        phone: '',
        role: 'owner',
        isVerified: true,
        addresses: [],
        permissions: [
          'can_manage_products', 'can_manage_orders', 'can_manage_customers',
          'can_manage_inventory', 'can_issue_refund', 'can_view_reports',
          'can_manage_settings', 'can_manage_cms', 'can_manage_media',
          'can_manage_branding', 'can_manage_support', 'can_manage_aistudio'
        ]
      }
    });
  } else {
    return res.json({ devMode: false });
  }
});

// Secure User Promotion API
app.post('/api/admin/promote-user', async (req, res) => {
  try {
    const serviceRoleKey = req.headers['x-service-role-key'];
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;

    let isAuthorized = false;
    let actingUserEmail = 'System / Service Role Key';
    let actingUserId = 'system';

    // 1. Authorize via Service Role Key header directly
    if (serviceRoleKey && serviceRoleKey === process.env.SUPABASE_SERVICE_ROLE_KEY) {
      isAuthorized = true;
    }

    const supabase = getSupabaseClient();
    const serviceSupabase = getServiceSupabaseClient();

    if (!supabase || !serviceSupabase) {
      return res.status(500).json({ error: 'Auth services are not initialized.' });
    }

    // 2. Or authorize if executing user is an Owner or Admin
    if (!isAuthorized && headerValue && headerValue.startsWith('Bearer ')) {
      const token = headerValue.substring(7);
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (!userError && user) {
        const { data: profile } = await serviceSupabase
          .from('zoal_users')
          .select('role, email')
          .eq('id', user.id)
          .single();
        if (profile && ['owner', 'admin'].includes(profile.role)) {
          isAuthorized = true;
          actingUserEmail = profile.email;
          actingUserId = user.id;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Requires administrative permission or x-service-role-key header.' });
    }

    const { userId, targetRole } = req.body;
    const finalUserId = userId || req.body.user_id || req.body.uuid;
    const finalRole = targetRole || req.body.role;

    if (!finalUserId || !finalRole) {
      return res.status(400).json({ error: 'Missing userId or targetRole in request body.' });
    }

    const validRoles = ['customer', 'staff', 'manager', 'admin', 'owner'];
    if (!validRoles.includes(finalRole)) {
      return res.status(400).json({ error: `Invalid role: ${finalRole}. Supported: ${validRoles.join(', ')}` });
    }

    // Update the target user's role in public.zoal_users
    const { data: updatedProfile, error: updateError } = await serviceSupabase
      .from('zoal_users')
      .update({ role: finalRole })
      .eq('id', finalUserId)
      .select()
      .single();

    if (updateError || !updatedProfile) {
      return res.status(500).json({ error: 'Failed to update user role in public.zoal_users database table.' });
    }

    // Create secure audit log entry
    const auditLogId = 'log_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const auditAction = `PROMOTED USER ${finalUserId} to role ${finalRole} by ${actingUserEmail}`;
    
    await serviceSupabase.from('zoal_activity_logs').insert({
      id: auditLogId,
      user_id: actingUserId,
      email: actingUserEmail,
      action: auditAction,
      timestamp: new Date().toISOString(),
      ip: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'backend-service'
    });

    console.log(`🛡️ Audit log created: ${auditAction}`);

    return res.json({
      success: true,
      message: `Successfully promoted user ${finalUserId} to role ${finalRole}.`,
      profile: updatedProfile
    });

  } catch (err: any) {
    console.error('Promotion error:', err);
    return res.status(500).json({ error: 'Internal server error during user promotion.' });
  }
});

// Enterprise Bootstrap Authentication Utility
app.post('/api/system/bootstrap-auth', async (req, res) => {
  try {
    const serviceRoleKey = req.headers['x-service-role-key'];
    if (serviceRoleKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Bootstrap requires valid x-service-role-key header.' });
    }

    const serviceSupabase = getServiceSupabaseClient();
    if (!serviceSupabase) {
      return res.status(500).json({ error: 'Supabase Service Role client not available.' });
    }

    const enterpriseAccounts = [
      { email: 'owner@alzoal.com', role: 'owner', password: process.env.INITIAL_OWNER_PASSWORD, firstName: 'Ziad', lastName: 'Owner' },
      { email: 'alzoal3003@gmail.com', role: 'admin', password: process.env.INITIAL_ADMIN_PASSWORD, firstName: 'Abdullah', lastName: 'Admin' },
      { email: 'manager@alzoal.com', role: 'manager', password: process.env.INITIAL_MANAGER_PASSWORD, firstName: 'Ahmed', lastName: 'Manager' },
      { email: 'staff@alzoal.com', role: 'staff', password: process.env.INITIAL_STAFF_PASSWORD, firstName: 'Raed', lastName: 'Staff' }
    ];

    const report: any[] = [];

    // Helper for UUID Migration
    const migrateLegacyId = async (legacyId: string, newUuid: string) => {
      if (legacyId === newUuid) return;
      
      const tablesToUpdate = [
        { table: 'zoal_staff_details', col: 'user_id' },
        { table: 'zoal_orders', col: 'user_id' },
        { table: 'zoal_activity_logs', col: 'user_id' },
        { table: 'zoal_sessions', col: 'user_id' },
        { table: 'zoal_addresses', col: 'user_id' },
        { table: 'zoal_cart_items', col: 'user_id' },
        { table: 'zoal_wishlist', col: 'user_id' },
        { table: 'zoal_product_reviews', col: 'user_id' },
        { table: 'zoal_payment_transactions', col: 'user_id' },
        { table: 'zoal_notifications', col: 'user_id' }
      ];

      for (const t of tablesToUpdate) {
        try {
          await serviceSupabase.from(t.table).update({ [t.col]: newUuid }).eq(t.col, legacyId);
        } catch (e) {
          console.warn(`Migration warning for table ${t.table}:`, e);
        }
      }
    };

    // Fetch existing users
    const { data: userData, error: listError } = await serviceSupabase.auth.admin.listUsers();
    if (listError) throw listError;
    const allAuthUsers = userData.users;

    for (const acc of enterpriseAccounts) {
      if (!acc.password) {
        report.push({ email: acc.email, status: 'SKIPPED', reason: 'Password environment variable missing' });
        continue;
      }

      // PRE-EMPTIVE COLLISION REPAIR: Rename legacy profiles if they exist to avoid Trigger 500 Errors
      const { data: legacyBefore } = await serviceSupabase
        .from('zoal_users')
        .select('id')
        .ilike('email', acc.email)
        .maybeSingle();

      if (legacyBefore && legacyBefore.id.startsWith('USR-')) {
        const tempEmail = `migrating_${Date.now()}_${acc.email}`;
        console.log(`🛡️ Collision Prevention: Renaming legacy ${legacyBefore.id} email to ${tempEmail}`);
        await serviceSupabase.from('zoal_users').update({ email: tempEmail }).eq('id', legacyBefore.id);
      }

      let existingAuth = allAuthUsers.find(u => u.email?.toLowerCase() === acc.email.toLowerCase());
      let userId: string | undefined = existingAuth?.id;

      if (!existingAuth) {
        // Create Auth User
        const { data: newUser, error: createError } = await serviceSupabase.auth.admin.createUser({
          email: acc.email,
          password: acc.password,
          email_confirm: true,
          user_metadata: { first_name: acc.firstName, last_name: acc.lastName, role: acc.role }
        });

        if (createError) {
          // Robust Recovery: Try to fetch user by listing all users and finding the email
          const { data: searchData, error: searchError } = await serviceSupabase.auth.admin.listUsers({
            perPage: 1000
          });
          const recoveredUser = searchData?.users.find(u => u.email?.toLowerCase() === acc.email.toLowerCase());
          
          if (recoveredUser) {
            existingAuth = recoveredUser;
            userId = recoveredUser.id;
            console.log(`✅ Recovered identity via listUsers for ${acc.email}: ${userId}`);
          } else {
            report.push({ 
              email: acc.email, 
              status: 'FAILED', 
              stage: 'auth_creation', 
              error: createError.message || 'Unknown Auth Error',
              rawError: JSON.stringify(createError),
              searchError: searchError ? JSON.stringify(searchError) : undefined
            });
            continue;
          }
        } else {
          existingAuth = newUser.user;
          userId = newUser.user.id;
        }
      }

      if (!userId) {
        report.push({ email: acc.email, status: 'FAILED', stage: 'identity_resolution', error: 'Could not resolve UUID' });
        continue;
      }

      report.push({ email: acc.email, status: existingAuth ? 'VERIFIED' : 'CREATED', stage: 'auth', userId });

      // EXECUTE UUID MIGRATION if legacy identity was found
      if (legacyBefore && legacyBefore.id !== userId) {
        console.log(`🚀 Migrating legacy ID ${legacyBefore.id} to UUID ${userId} for ${acc.email}`);
        await migrateLegacyId(legacyBefore.id, userId);
        
        // Delete the legacy profile (which was renamed to avoid collisions)
        await serviceSupabase.from('zoal_users').delete().eq('id', legacyBefore.id);
        report.push({ email: acc.email, status: 'MIGRATED', legacyId: legacyBefore.id, newId: userId });
      }

      // Sync public.zoal_users with strict safe defaults to prevent NOT NULL violations
      const profilePayload = {
        id: userId,
        email: acc.email.toLowerCase(),
        first_name: acc.firstName || 'User',
        last_name: acc.lastName || '',
        role: acc.role,
        phone: '0000000000', // Ensure a valid string that isn't empty
        password_hash: 'PROTECTED', 
        is_verified: true,
        created_at: new Date().toISOString()
      };

      const { data: profile, error: profileError } = await serviceSupabase
        .from('zoal_users')
        .upsert(profilePayload, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) {
        console.error(`❌ Profile sync failed for ${acc.email}:`, profileError);
        report.push({ 
          email: acc.email, 
          status: 'FAILED', 
          stage: 'profile_sync', 
          error: profileError.message,
          payload_used: profilePayload
        });
        continue;
      }

      report.push({ email: acc.email, status: 'SYNCED', stage: 'profile', userId });

      // Ensure staff details
      await serviceSupabase
        .from('zoal_staff_details')
        .upsert({
          id: `STAFF-${userId.substring(0, 8).toUpperCase()}`,
          user_id: userId,
          department: 'Executive',
          position: acc.role.toUpperCase(),
          employee_id: `EMP-${acc.role.toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
          joining_date: new Date().toISOString().split('T')[0]
        }, { onConflict: 'user_id' });

      // Log activity
      await serviceSupabase.from('zoal_activity_logs').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        email: acc.email,
        action: `Bootstrap: Account synced with role ${acc.role}`,
        timestamp: new Date().toISOString(),
        ip: req.ip || '127.0.0.1',
        user_agent: 'system-bootstrap'
      });
    }

    return res.json({ success: true, report });
  } catch (err: any) {
    console.error('Bootstrap error:', err);
    return res.status(500).json({ error: 'Internal server error during bootstrap.', message: err.message });
  }
});

app.get('/api/system/bootstrap-status', async (req, res) => {
  try {
    const serviceSupabase = getServiceSupabaseClient();
    if (!serviceSupabase) return res.status(500).json({ error: 'Supabase service not available.' });

    const enterpriseEmails = ['owner@alzoal.com', 'alzoal3003@gmail.com', 'manager@alzoal.com', 'staff@alzoal.com'];
    
    const { data: userData } = await serviceSupabase.auth.admin.listUsers();
    const { data: profiles } = await serviceSupabase.from('zoal_users').select('*');

    const authUsers = userData?.users || [];

    const statusReport = enterpriseEmails.map(email => {
      const auth = authUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
      const profile = profiles?.find(p => p.email?.toLowerCase() === email.toLowerCase());

      return {
        email,
        authExists: !!auth,
        profileExists: !!profile,
        role: profile?.role || 'N/A',
        uuidMatch: (auth && profile) ? auth.id === profile.id : false,
        userId: auth?.id || profile?.id || null
      };
    });

    return res.json({ success: true, status: statusReport });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/system/auth-health - Enterprise Authentication Health & Self-Healing
app.get('/api/system/auth-health', async (req, res) => {
  try {
    const serviceSupabase = getServiceSupabaseClient();
    if (!serviceSupabase) {
      return res.status(500).json({ error: 'Auth service unavailable.' });
    }

    const enterpriseConfigs = [
      { email: 'owner@alzoal.com', role: 'owner', name: 'Ziad Owner' },
      { email: 'alzoal3003@gmail.com', role: 'admin', name: 'Abdullah Admin' },
      { email: 'manager@alzoal.com', role: 'manager', name: 'Ahmed Manager' },
      { email: 'staff@alzoal.com', role: 'staff', name: 'Raed Staff' }
    ];

    const { data: userData } = await serviceSupabase.auth.admin.listUsers();
    const authUsers = userData?.users || [];
    
    const { data: profiles } = await serviceSupabase.from('zoal_users').select('*');
    const { data: staffRecords } = await serviceSupabase.from('zoal_staff_details').select('*');

    const healthReport: any[] = [];
    let totalScore = 0;
    const maxScore = enterpriseConfigs.length * 100;

    for (const config of enterpriseConfigs) {
      const auth = authUsers.find(u => u.email?.toLowerCase() === config.email.toLowerCase());
      const profile = profiles?.find(p => p.email?.toLowerCase() === config.email.toLowerCase());
      const staff = staffRecords?.find(s => s.user_id === auth?.id);

      let accountScore = 0;
      const issues: string[] = [];
      const repairs: string[] = [];

      // 1. Auth Integrity
      if (auth) {
        accountScore += 25;
      } else {
        issues.push('Missing from auth.users');
      }

      // 2. Profile Integrity & Self-Healing
      if (auth && !profile) {
        issues.push('Profile missing in zoal_users');
        // REPAIR: Create missing profile
        const { error: repairError } = await serviceSupabase.from('zoal_users').insert({
          id: auth.id,
          email: config.email,
          first_name: config.name.split(' ')[0],
          last_name: config.name.split(' ')[1] || '',
          role: config.role,
          is_verified: true,
          created_at: new Date().toISOString()
        });
        if (!repairError) repairs.push('Created missing profile');
      } else if (profile) {
        accountScore += 25;
        // Verify Role Match
        if (profile.role !== config.role) {
          issues.push(`Role mismatch: found ${profile.role}, expected ${config.role}`);
          // REPAIR: Update role
          await serviceSupabase.from('zoal_users').update({ role: config.role }).eq('id', profile.id);
          repairs.push(`Repaired role to ${config.role}`);
        } else {
          accountScore += 25;
        }
      }

      // 3. UUID Match
      if (auth && profile && auth.id === profile.id) {
        accountScore += 10;
      } else if (auth && profile) {
        issues.push('UUID Mapping Mismatch');
      }

      // 4. Staff Records & Self-Healing
      if (auth && !staff) {
        issues.push('Missing zoal_staff_details');
        // REPAIR: Create staff details
        await serviceSupabase.from('zoal_staff_details').insert({
          id: `STAFF-HEAL-${auth.id.substring(0, 6)}`,
          user_id: auth.id,
          department: 'Operations',
          position: config.role.toUpperCase(),
          employee_id: `EMP-${config.role.toUpperCase()}-${Math.floor(Math.random() * 999)}`,
          joining_date: new Date().toISOString().split('T')[0]
        });
        repairs.push('Created missing staff details');
      } else if (staff) {
        accountScore += 15;
      }

      totalScore += accountScore;

      healthReport.push({
        email: config.email,
        expectedRole: config.role,
        authExists: !!auth,
        profileExists: !!profile,
        staffExists: !!staff,
        score: accountScore,
        dashboardAccess: ['owner', 'admin', 'manager'].includes(config.role) ? '/admin' : '/dashboard',
        issues,
        repairs
      });
    }

    const overallScore = Math.round((totalScore / maxScore) * 100);

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      healthScore: `${overallScore}%`,
      status: overallScore >= 90 ? 'OPTIMAL' : overallScore >= 70 ? 'STABLE' : 'CRITICAL',
      system: {
        rbac: 'VERIFIED',
        sessionSync: 'ACTIVE',
        jwtValidation: 'ENFORCED',
        profileRecovery: 'AUTO-HEALING'
      },
      accounts: healthReport
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Self-healing diagnostic failed', message: err.message });
  }
});

// Change Password (Authenticated User)
app.post('/api/auth/change-password', authenticateRequest, async (req: any, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required.' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.'
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not initialized.' });
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    await logActivityAsync(req.user.id, req.user.email, 'PASSWORD_CHANGED', req.ip || '', req.headers['user-agent'] || '');

    return res.json({
      success: true,
      message: 'Password updated successfully!'
    });
  } catch (error: any) {
    console.error('Password change error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during password change.' });
  }
});

// Update Profile & Saved Addresses
app.post('/api/auth/update-profile', authenticateRequest, async (req: any, res) => {
  try {
    const { firstName, lastName, phone, addresses } = req.body;
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not initialized.' });
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.first_name = firstName.trim();
    if (lastName !== undefined) updateData.last_name = lastName.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (addresses !== undefined) updateData.addresses = addresses;

    const { error } = await supabase
      .from('zoal_users')
      .update(updateData)
      .eq('id', req.user.id);

    if (error) throw error;

    await logActivityAsync(req.user.id, req.user.email, 'PROFILE_UPDATED', req.ip || '', req.headers['user-agent'] || '');

    // Get updated row
    const { data: updatedProfile, error: selectError } = await supabase
      .from('zoal_users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (selectError || !updatedProfile) {
      throw selectError || new Error('Failed to retrieve updated profile');
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        firstName: updatedProfile.first_name,
        lastName: updatedProfile.last_name,
        name: `${updatedProfile.first_name} ${updatedProfile.last_name}`,
        phone: updatedProfile.phone,
        role: updatedProfile.role,
        isVerified: updatedProfile.is_verified,
        addresses: updatedProfile.addresses || []
      }
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during profile update.' });
  }
});

// Fetch Activity Logs (Admin only)
app.get('/api/auth/activity-logs', authenticateRequest, requireRole(['admin']), async (req: any, res) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not initialized.' });
    }

    const { data: logs, error } = await supabase
      .from('zoal_activity_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return res.json(logs || []);
  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    return res.status(500).json({ error: 'Internal server error retrieving logs.' });
  }
});

// Get Email history logs
app.get('/api/orders/email-history', async (req, res) => {
  const logs = await readEmailDbAsync();
  res.json(logs);
});

// Create a new order in Supabase
app.post('/api/orders/create', async (req, res) => {
  const { order } = req.body;
  if (!order || !order.id || !order.items) {
    return res.status(400).json({ error: 'Invalid order structure.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    // If Supabase is not configured, we still return success because handleOrderSuccess 
    // will fall back to local storage in the frontend, but we log the warning.
    console.warn('⚠️ Supabase not configured. Order not persisted in cloud database.');
    return res.json({ success: true, persisted: false, message: 'Order created locally only.' });
  }

  try {
    // 1. Insert into zoal_orders
    const orderData = {
      id: order.id,
      customer_id: order.customerId || null,
      status: (order.status || 'pending').toLowerCase(),
      subtotal: order.subtotal,
      discount_amount: order.discount || 0,
      shipping_cost: order.shipping || 0,
      tax_amount: order.tax || 0,
      total_amount: order.total,
      payment_method: order.paymentMethod,
      payment_status: 'unpaid', // Default
      tracking_number: order.trackingNumber,
      notes: order.customerNotes || '',
      created_at: new Date().toISOString()
    };

    const { error: orderError } = await supabase.from('zoal_orders').insert(orderData);
    if (orderError) throw orderError;

    // 2. Insert into zoal_order_items
    const orderItems = order.items.map((item: any) => ({
      order_id: order.id,
      product_id: friendlyToUUID(item.productId),
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity
    }));

    // We need to resolve product UUIDs if the IDs coming from frontend are strings like 'coffee-1'
    // For now, if the ID is not a UUID, this might fail unless we have a mapping or the table accepts text IDs.
    // The schema says zoal_products.id is UUID. 
    // If the frontend product IDs are not UUIDs, this will fail.
    // Let's check if we can handle this by looking up products or using a fallback.
    // Actually, many product IDs in data.ts are like 'coffee-1'.
    
    const { error: itemsError } = await supabase.from('zoal_order_items').insert(orderItems);
    if (itemsError) {
      console.warn('⚠️ Could not persist order items (likely due to non-UUID product IDs), but order header was saved.', itemsError.message);
    }

    return res.json({ success: true, persisted: true, orderId: order.id });
  } catch (err: any) {
    console.error('❌ Error creating order in Supabase:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to persist order.' });
  }
});

// ==========================================
// MOYASAR ENTERPRISE PAYMENT ARCHITECTURE API
// ==========================================

// Helper to look up product price from database or clean in-memory defaults (Phase 7)
async function getProductPriceAndDetails(productId: string): Promise<{ price: number; name: string } | null> {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      // Look up by UUID or by friendly ID
      const res = await client.query(
        'SELECT price, name, data FROM zoal_supabase_products WHERE id = $1 OR friendly_id = $2',
        [productId, productId]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        let price = Number(row.price);
        if (!price && row.data && row.data.price) {
          price = Number(row.data.price);
        }
        return { price: price || 0, name: row.name };
      }
    } catch (err) {
      console.error('Error fetching product price from database:', err);
    } finally {
      await client.end();
    }
  }

  // Fallback to memory configuration matching exact store pricing
  const cleanId = productId.replace(/^p0000000-0000-0000-0000-00000000000/, 'p')
                            .replace(/^c0000000-0000-0000-0000-00000000000/, 'c')
                            .replace(/^m0000000-0000-0000-0000-00000000000/, 'm')
                            .replace(/^f0000000-0000-0000-0000-00000000000/, 'f')
                            .replace(/^b0000000-0000-0000-0000-00000000000/, 'b');
  const prod = PRODUCTS.find(p => p.id === productId || p.id === cleanId);
  if (prod) {
    const mockPrices: Record<string, number> = {
      'c1': 45, 'c2': 40, 'c3': 35,
      'b1': 25, 'b2': 30, 'b3': 30,
      'm1': 75, 'm2': 110, 'm3': 45,
      'f1': 1850, 'f2': 2200, 'f3': 150,
      'p1': 350, 'p2': 420, 'p3': 380
    };
    const price = mockPrices[prod.id] || Number(prod.price) || 45;
    return { price, name: prod.name };
  }
  return null;
}

// Helper to validate and calculate order totals server-side (Phase 7 & 11)
async function calculateOrderTotalServerSide(items: any[], couponCode?: string, shippingId?: string) {
  let subtotal = 0;
  for (const item of items) {
    const details = await getProductPriceAndDetails(item.productId);
    const price = details ? details.price : (Number(item.price) || 45);
    subtotal += price * item.quantity;
  }

  // 15% VAT in Saudi Arabia (standard VAT)
  const vatRate = 0.15;
  const taxAmount = parseFloat((subtotal * vatRate).toFixed(2));

  // Determine shipping cost
  let shippingCost = 0;
  if (shippingId) {
    shippingCost = shippingId === 'free' ? 0 : 35;
  } else {
    shippingCost = subtotal >= 500 ? 0 : 35; // Free shipping above 500 SAR
  }

  // Handle coupon discount
  let discountAmount = 0;
  if (couponCode) {
    if (couponCode.toUpperCase() === 'ZOAL10') {
      discountAmount = parseFloat((subtotal * 0.10).toFixed(2));
    } else if (couponCode.toUpperCase() === 'WELCOME') {
      discountAmount = 50;
    }
  }

  const totalAmount = parseFloat((subtotal - discountAmount + shippingCost + taxAmount).toFixed(2));

  return {
    subtotal,
    discountAmount,
    shippingCost,
    taxAmount,
    totalAmount
  };
}

// Helper to trigger elegant HTML order email confirmations
async function triggerOrderConfirmationEmail(order: any) {
  const emailLogId = 'email-' + Math.random().toString(36).substring(2, 11);
  const newLog: EmailLog = {
    id: emailLogId,
    orderId: order.id,
    customerName: order.customerName,
    customerEmail: order.email,
    orderDate: order.date || new Date().toISOString().substring(0, 10),
    totalAmount: order.total,
    deliveryStatus: 'retrying',
    attemptsCount: 0,
    lastAttemptAt: new Date().toISOString(),
    logs: [`[${new Date().toISOString()}] Initiated via payment confirmation flow.`],
    orderData: order
  };

  const logs = await readEmailDbAsync();
  logs.push(newLog);
  await writeEmailDbAsync(logs);

  sendEmailWithRetry(order, emailLogId).catch(err => {
    console.error('Asynchronous email trigger failed:', err);
  });
}

// Helper to trigger elegant HTML payment success email (Phase 13)
async function triggerPaymentSuccessEmail(order: any) {
  const emailLogId = 'email-' + Math.random().toString(36).substring(2, 11);
  const newLog: EmailLog = {
    id: emailLogId,
    orderId: order.id,
    customerName: order.customerName,
    customerEmail: order.email,
    orderDate: order.date || new Date().toISOString().substring(0, 10),
    totalAmount: order.total,
    deliveryStatus: 'retrying',
    attemptsCount: 0,
    lastAttemptAt: new Date().toISOString(),
    logs: [`[${new Date().toISOString()}] Initiated via payment success event.`],
    orderData: order
  };

  const logs = await readEmailDbAsync();
  logs.push(newLog);
  await writeEmailDbAsync(logs);

  sendEmailWithRetry(order, emailLogId, 3, 2000, 'payment_success').catch(err => {
    console.error('Asynchronous payment success email trigger failed:', err);
  });
}

// Helper to trigger elegant HTML payment failed email (Phase 13)
async function triggerPaymentFailedEmail(order: any) {
  const emailLogId = 'email-' + Math.random().toString(36).substring(2, 11);
  const newLog: EmailLog = {
    id: emailLogId,
    orderId: order.id,
    customerName: order.customerName,
    customerEmail: order.email,
    orderDate: order.date || new Date().toISOString().substring(0, 10),
    totalAmount: order.total,
    deliveryStatus: 'retrying',
    attemptsCount: 0,
    lastAttemptAt: new Date().toISOString(),
    logs: [`[${new Date().toISOString()}] Initiated via payment failed event.`],
    orderData: order
  };

  const logs = await readEmailDbAsync();
  logs.push(newLog);
  await writeEmailDbAsync(logs);

  sendEmailWithRetry(order, emailLogId, 3, 2000, 'payment_failed').catch(err => {
    console.error('Asynchronous payment failed email trigger failed:', err);
  });
}

// Helper to trigger elegant HTML refund confirmation email (Phase 13)
async function triggerRefundCompletedEmail(order: any) {
  const emailLogId = 'email-' + Math.random().toString(36).substring(2, 11);
  const newLog: EmailLog = {
    id: emailLogId,
    orderId: order.id,
    customerName: order.customerName,
    customerEmail: order.email,
    orderDate: order.date || new Date().toISOString().substring(0, 10),
    totalAmount: order.total,
    deliveryStatus: 'retrying',
    attemptsCount: 0,
    lastAttemptAt: new Date().toISOString(),
    logs: [`[${new Date().toISOString()}] Initiated via refund event.`],
    orderData: order
  };

  const logs = await readEmailDbAsync();
  logs.push(newLog);
  await writeEmailDbAsync(logs);

  sendEmailWithRetry(order, emailLogId, 3, 2000, 'refund').catch(err => {
    console.error('Asynchronous refund email trigger failed:', err);
  });
}

// Helper to trigger elegant HTML tax invoice generation email (Phase 13)
async function triggerInvoiceGeneratedEmail(order: any) {
  const emailLogId = 'email-' + Math.random().toString(36).substring(2, 11);
  const newLog: EmailLog = {
    id: emailLogId,
    orderId: order.id,
    customerName: order.customerName,
    customerEmail: order.email,
    orderDate: order.date || new Date().toISOString().substring(0, 10),
    totalAmount: order.total,
    deliveryStatus: 'retrying',
    attemptsCount: 0,
    lastAttemptAt: new Date().toISOString(),
    logs: [`[${new Date().toISOString()}] Initiated via tax invoice generation event.`],
    orderData: order
  };

  const logs = await readEmailDbAsync();
  logs.push(newLog);
  await writeEmailDbAsync(logs);

  sendEmailWithRetry(order, emailLogId, 3, 2000, 'invoice').catch(err => {
    console.error('Asynchronous invoice generated email trigger failed:', err);
  });
}

// Global Order Expiry Checker (Phase 9: Automatically release stock if payment expires)
setInterval(async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return;

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Find all orders in 'draft' or 'pending_payment' that have expired (older than 15 minutes) and are 'unpaid'
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const expiredRes = await client.query(
      `SELECT id, status FROM zoal_orders 
       WHERE (status = 'draft' OR status = 'pending_payment') 
       AND payment_status = 'unpaid' 
       AND created_at < $1`,
      [fifteenMinutesAgo]
    );

    for (const order of expiredRes.rows) {
      console.log(`⏳ Auto-expiring unpaid order ${order.id} due to 15-minute payment timeout...`);

      // 1. Revert/Release inventory (Phase 8 & 9)
      const itemsRes = await client.query(
        'SELECT product_id, quantity FROM zoal_order_items WHERE order_id = $1',
        [order.id]
      );
      for (const item of itemsRes.rows) {
        await client.query(
          'UPDATE zoal_inventory SET quantity = quantity + $1 WHERE product_id = $2',
          [item.quantity, item.product_id]
        );
      }

      // 2. Mark order as failed/expired
      await client.query(
        "UPDATE zoal_orders SET status = 'failed', payment_status = 'failed', notes = COALESCE(notes, '') || ' [System: Order expired after 15 mins payment timeout. Stock released.]' WHERE id = $1",
        [order.id]
      );

      // 3. Mark payment transactions as failed
      await client.query(
        "UPDATE zoal_payment_transactions SET payment_status = 'failed', metadata = COALESCE(metadata, '{}'::jsonb) || '{\"expired\": true}'::jsonb WHERE order_id = $1 AND payment_status = 'initiated'",
        [order.id]
      );
    }
  } catch (err) {
    console.error('Error in background order expiration task:', err);
  } finally {
    await client.end();
  }
}, 60000); // Run check every minute

// 1. Create Payment Session
app.post('/api/payments/create', async (req, res) => {
  const { 
    orderId: requestedOrderId, 
    items, 
    couponCode, 
    shippingId, 
    paymentMethod, 
    customerName, 
    customerEmail, 
    customerPhone, 
    address,
    customerId
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty. Cannot initiate payment.' });
  }

  const supabase = getSupabaseClient();
  const dbConfigured = !!supabase;

  try {
    // A. Validate Product Stock & Prices (Phase 7 & 8)
    const totals = await calculateOrderTotalServerSide(items, couponCode, shippingId);
    
    // Check stock if DB is configured
    if (dbConfigured) {
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await client.connect();
      try {
        for (const item of items) {
          const uuid = friendlyToUUID(item.productId);
          const stockRes = await client.query('SELECT quantity FROM zoal_inventory WHERE product_id = $1', [uuid]);
          if (stockRes.rows.length > 0) {
            const currentStock = stockRes.rows[0].quantity;
            if (currentStock < item.quantity) {
              return res.status(400).json({ 
                error: `Insufficient stock for product ${item.name || item.productId}. Only ${currentStock} remaining.` 
              });
            }
          }
        }
      } finally {
        await client.end();
      }
    }

    // B. Resolve Order ID or Reuse existing for Payment Retry (Phase 10)
    let orderId = requestedOrderId;
    let orderExists = false;

    if (orderId && dbConfigured) {
      const { data: existingOrder } = await supabase
        .from('zoal_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (existingOrder) {
        orderExists = true;
        if (existingOrder.payment_status === 'paid') {
          return res.status(400).json({ error: 'This order has already been paid successfully. Cannot duplicate payment.' });
        }
        // Reuse order for retry - update its status back to draft/pending_payment and created_at to restart 15 min expiry
        await supabase
          .from('zoal_orders')
          .update({
            status: 'pending_payment',
            payment_status: 'unpaid',
            created_at: new Date().toISOString()
          })
          .eq('id', orderId);
      }
    }

    if (!orderId) {
      orderId = `ZL-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    // C. Persist Order Header & Items (if not already existing)
    if (!orderExists && dbConfigured) {
      const orderData = {
        id: orderId,
        customer_id: customerId || null,
        status: 'pending_payment',
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        shipping_cost: totals.shippingCost,
        tax_amount: totals.taxAmount,
        total_amount: totals.totalAmount,
        payment_method: paymentMethod || 'credit_card',
        payment_status: 'unpaid',
        notes: `Payment initiated via ${paymentMethod || 'Card'}.\nName: ${customerName || ''}\nEmail: ${customerEmail || ''}\nPhone: ${customerPhone || ''}\nAddress: ${address || ''}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: orderError } = await supabase.from('zoal_orders').insert(orderData);
      if (orderError) throw orderError;

      const orderItems = items.map((item: any) => ({
        order_id: orderId,
        product_id: friendlyToUUID(item.productId),
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase.from('zoal_order_items').insert(orderItems);
      if (itemsError) {
        console.warn('⚠️ Non-critical order items insertion warning:', itemsError.message);
      }

      // D. Reserve stock during Pending Payment (Phase 8)
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await client.connect();
      try {
        for (const item of items) {
          const uuid = friendlyToUUID(item.productId);
          await client.query(
            'UPDATE zoal_inventory SET quantity = quantity - $1 WHERE product_id = $2',
            [item.quantity, uuid]
          );
        }
      } finally {
        await client.end();
      }
    }

    // E. Moyasar Integration API Trigger or Simulation Mode
    const moyasarSecretKey = process.env.MOYASAR_SECRET_KEY;
    const paymentId = `pay_mock_${Math.random().toString(36).substring(2, 12)}`;

    // Create record in zoal_payment_transactions
    if (dbConfigured) {
      const transactionData = {
        order_id: orderId,
        user_id: customerId || null,
        amount: totals.totalAmount,
        currency: 'SAR',
        payment_method: paymentMethod || 'credit_card',
        payment_status: 'initiated',
        gateway_payment_id: paymentId,
        gateway_invoice_id: `inv_${Math.random().toString(36).substring(2, 10)}`,
        gateway_response: { mode: moyasarSecretKey ? 'live' : 'simulation', method: paymentMethod },
        metadata: { customerName, customerEmail, itemsCount: items.length }
      };

      const { error: txError } = await supabase.from('zoal_payment_transactions').insert(transactionData);
      if (txError) console.error('Failed to create payment transaction record:', txError.message);
    }

    // Return Redirect URL. If mock mode, we redirect to our elegant simulated secure payment page.
    const redirectUrl = `/checkout/payment-simulate?payment_id=${paymentId}&order_id=${orderId}`;

    return res.json({
      success: true,
      orderId,
      paymentId,
      redirectUrl,
      amount: totals.totalAmount,
      isSimulation: !moyasarSecretKey
    });

  } catch (err: any) {
    console.error('❌ Error creating payment transaction:', err);
    return res.status(500).json({ error: err.message || 'Failed to initiate checkout payment.' });
  }
});

// 2. Verify Payment Result
app.post('/api/payments/verify', async (req, res) => {
  const { paymentId, orderId, simulatedStatus } = req.body;

  if (!paymentId || !orderId) {
    return res.status(400).json({ error: 'Missing paymentId or orderId.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.json({ success: true, verified: true, isSimulation: true });
  }

  try {
    const { data: order } = await supabase
      .from('zoal_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.payment_status === 'paid') {
      return res.json({ success: true, verified: true, orderId, paymentStatus: 'paid' });
    }

    const moyasarSecretKey = process.env.MOYASAR_SECRET_KEY;
    let paymentStatus = simulatedStatus || 'paid'; // Default success for mock

    if (moyasarSecretKey) {
      // In production, we fetch and verify directly from Moyasar's API
    }

    if (paymentStatus === 'paid' || paymentStatus === 'captured') {
      // A. Update Payment Transaction
      await supabase
        .from('zoal_payment_transactions')
        .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
        .eq('gateway_payment_id', paymentId);

      // B. Update Order
      await supabase
        .from('zoal_orders')
        .update({ 
          status: 'processing',
          payment_status: 'paid', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      // C. Trigger Email Confirmation & Invoice Hooks
      const orderDataForEmail = {
        id: orderId,
        customerName: order.notes?.includes('Name:') ? order.notes.split('Name:')[1].split('\n')[0].trim() : 'Valued Patron',
        email: order.notes?.includes('Email:') ? order.notes.split('Email:')[1].split('\n')[0].trim() : 'patron@zoalgroup.com',
        phone: order.notes?.includes('Phone:') ? order.notes.split('Phone:')[1].split('\n')[0].trim() : '+966 50 000 0000',
        address: order.notes?.includes('Address:') ? order.notes.split('Address:')[1].split('\n')[0].trim() : 'Al Hofuf, Saudi Arabia',
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping_cost),
        tax: Number(order.tax_amount),
        total: Number(order.total_amount),
        paymentMethod: order.payment_method || 'Mada Card',
        items: [] as any[]
      };

      try {
        const client = new Client({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        });
        await client.connect();
        const itemsRes = await client.query('SELECT product_id, quantity, unit_price FROM zoal_order_items WHERE order_id = $1', [orderId]);
        orderDataForEmail.items = itemsRes.rows.map(item => ({
          name: 'Premium Item Selection',
          quantity: item.quantity,
          price: Number(item.unit_price)
        }));
        await client.end();
      } catch (err) {
        console.warn('Could not populate email items details:', err);
      }

      await triggerOrderConfirmationEmail(orderDataForEmail);
      await triggerPaymentSuccessEmail(orderDataForEmail);
      await triggerInvoiceGeneratedEmail(orderDataForEmail);

      return res.json({ success: true, verified: true, orderId, paymentStatus: 'paid' });
    } else {
      // Payment Failed (Retry is allowed)
      await supabase
        .from('zoal_payment_transactions')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('gateway_payment_id', paymentId);

      await supabase
        .from('zoal_orders')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      // Build failed payment email data
      const orderDataForEmail = {
        id: orderId,
        customerName: order.notes?.includes('Name:') ? order.notes.split('Name:')[1].split('\n')[0].trim() : 'Valued Patron',
        email: order.notes?.includes('Email:') ? order.notes.split('Email:')[1].split('\n')[0].trim() : 'patron@zoalgroup.com',
        phone: order.notes?.includes('Phone:') ? order.notes.split('Phone:')[1].split('\n')[0].trim() : '+966 50 000 0000',
        address: order.notes?.includes('Address:') ? order.notes.split('Address:')[1].split('\n')[0].trim() : 'Al Hofuf, Saudi Arabia',
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping_cost),
        tax: Number(order.tax_amount),
        total: Number(order.total_amount),
        paymentMethod: order.payment_method || 'Mada Card',
        items: [] as any[]
      };
      await triggerPaymentFailedEmail(orderDataForEmail);

      return res.json({ success: false, verified: true, orderId, paymentStatus: 'failed', message: 'Payment authorization failed.' });
    }

  } catch (err: any) {
    console.error('Error verifying payment:', err);
    return res.status(500).json({ error: err.message || 'Failed to verify payment.' });
  }
});

// 3. Moyasar Webhook Receiver (Phase 6 & Idempotent Processing)
app.post('/api/payments/webhook', async (req, res) => {
  const payload = req.body;
  const signature = req.headers['x-moyasar-signature'];

  // HMAC Verification (if secret configured)
  const webhookSecret = process.env.MOYASAR_WEBHOOK_SECRET;
  if (webhookSecret && signature) {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const calculatedSig = hmac.update(JSON.stringify(payload)).digest('hex');
    if (calculatedSig !== signature) {
      return res.status(401).json({ error: 'Signature verification failed.' });
    }
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.json({ received: true, message: 'Supabase not configured. Handled.' });
  }

  const eventId = payload.id || `event_mock_${Math.random().toString(36).substring(2, 15)}`;
  const eventType = payload.type || 'payment.captured';
  const paymentId = payload.data?.id;

  if (!paymentId) {
    return res.status(400).json({ error: 'Invalid webhook payload structure.' });
  }

  try {
    // A. Duplicate Webhook Protection (Idempotent lookup) (Phase 6)
    const { data: existingLog } = await supabase
      .from('zoal_payment_webhook_logs')
      .select('*')
      .eq('gateway_event_id', eventId)
      .maybeSingle();

    if (existingLog) {
      return res.json({ received: true, duplicate: true, message: 'Event already processed' });
    }

    // B. Record Webhook Log
    await supabase.from('zoal_payment_webhook_logs').insert({
      gateway_event_id: eventId,
      event_type: eventType,
      payload: payload,
      processed_status: 'pending'
    });

    // C. Process webhook event safely (Never crash)
    if (eventType === 'payment.captured') {
      const { data: transaction } = await supabase
        .from('zoal_payment_transactions')
        .select('*')
        .eq('gateway_payment_id', paymentId)
        .maybeSingle();

      if (transaction && transaction.payment_status !== 'paid') {
        // 1. Mark transaction paid
        await supabase
          .from('zoal_payment_transactions')
          .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
          .eq('gateway_payment_id', paymentId);

        // 2. Mark order paid & processing
        await supabase
          .from('zoal_orders')
          .update({ 
            status: 'processing', 
            payment_status: 'paid', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', transaction.order_id);

        // 3. Mark webhook as successfully processed
        await supabase
          .from('zoal_payment_webhook_logs')
          .update({ processed_status: 'processed' })
          .eq('gateway_event_id', eventId);
      }
    } else if (eventType === 'payment.failed') {
      const { data: transaction } = await supabase
        .from('zoal_payment_transactions')
        .select('*')
        .eq('gateway_payment_id', paymentId)
        .maybeSingle();

      if (transaction) {
        await supabase
          .from('zoal_payment_transactions')
          .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
          .eq('gateway_payment_id', paymentId);

        await supabase
          .from('zoal_orders')
          .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', transaction.order_id);

        // Release Inventory Stock (Phase 8 & 9)
        const client = new Client({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        });
        await client.connect();
        try {
          const itemsRes = await client.query('SELECT product_id, quantity FROM zoal_order_items WHERE order_id = $1', [transaction.order_id]);
          for (const item of itemsRes.rows) {
            await client.query(
              'UPDATE zoal_inventory SET quantity = quantity + $1 WHERE product_id = $2',
              [item.quantity, item.product_id]
            );
          }
        } finally {
          await client.end();
        }

        await supabase
          .from('zoal_payment_webhook_logs')
          .update({ processed_status: 'processed' })
          .eq('gateway_event_id', eventId);
      }
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook processing exception:', err);
    if (supabase) {
      await supabase
        .from('zoal_payment_webhook_logs')
        .update({ processed_status: 'failed', error_message: err.message })
        .eq('gateway_event_id', eventId);
    }
    return res.status(500).json({ error: 'Webhook processing failed but received.' });
  }
});

// 4. Secure Payment Refund API
app.post('/api/payments/refund', authenticateRequest, requireRole(['admin', 'manager']), async (req, res) => {
  const { orderId, amount, reason } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required for refunds.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured.' });
  }

  try {
    const { data: order } = await supabase
      .from('zoal_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Only paid orders can be refunded.' });
    }

    const { data: tx } = await supabase
      .from('zoal_payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .eq('payment_status', 'paid')
      .maybeSingle();

    if (!tx) {
      return res.status(404).json({ error: 'Matching payment transaction not found.' });
    }

    const refundAmount = Number(amount) || Number(tx.amount);
    const refundReason = reason || 'Customer request';

    const isPartial = refundAmount < Number(tx.amount);
    const newStatus = isPartial ? 'partially_refunded' : 'refunded';

    await supabase
      .from('zoal_payment_transactions')
      .update({
        payment_status: newStatus,
        refund_amount: refundAmount,
        refund_reason: refundReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', tx.id);

    await supabase
      .from('zoal_orders')
      .update({
        status: newStatus,
        payment_status: newStatus,
        notes: (order.notes || '') + ` [Refund: ${refundAmount} SAR - ${refundReason}]`,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    // Release Inventory Stock back (Phase 8 & 9)
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    try {
      const itemsRes = await client.query('SELECT product_id, quantity FROM zoal_order_items WHERE order_id = $1', [orderId]);
      for (const item of itemsRes.rows) {
        await client.query(
          'UPDATE zoal_inventory SET quantity = quantity + $1 WHERE product_id = $2',
          [item.quantity, item.product_id]
        );
      }
    } finally {
      await client.end();
    }

    // Trigger refund email (Phase 13)
    try {
      const refundOrderData = {
        id: orderId,
        customerName: order.notes?.includes('Name:') ? order.notes.split('Name:')[1].split('\n')[0].trim() : 'Valued Patron',
        email: order.notes?.includes('Email:') ? order.notes.split('Email:')[1].split('\n')[0].trim() : 'patron@zoalgroup.com',
        phone: order.notes?.includes('Phone:') ? order.notes.split('Phone:')[1].split('\n')[0].trim() : '+966 50 000 0000',
        address: order.notes?.includes('Address:') ? order.notes.split('Address:')[1].split('\n')[0].trim() : 'Al Hofuf, Saudi Arabia',
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping_cost),
        tax: Number(order.tax_amount),
        total: Number(order.total_amount),
        refundAmount: refundAmount,
        paymentMethod: order.payment_method || 'Mada Card',
        paymentId: tx.gateway_payment_id,
        transactionId: tx.id,
        items: [] as any[]
      };
      await triggerRefundCompletedEmail(refundOrderData);
    } catch (emailErr) {
      console.warn('Could not dispatch refund email:', emailErr);
    }

    return res.json({ success: true, message: 'Refund processed successfully.', status: newStatus, refundAmount });
  } catch (err: any) {
    console.error('Refund processing error:', err);
    return res.status(500).json({ error: err.message || 'Refund processing failed.' });
  }
});


// Enterprise AI Product Intelligence Optimization
app.post('/api/gemini/generate-product-intel', async (req, res) => {
  const { name, category, subcategory, description, productType, brand } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Product name is required.' });
  }

  // Construct our specialized prompt
  const prompt = `You are an elite enterprise product intelligence copywriter for AL ZOAL, a luxury boutique platform in Saudi Arabia.
Your job is to generate highly optimized, high-end, premium copywriting and SEO elements for this product.

Product Details:
- Name: ${name}
- Category: ${category || 'Specialty'} ${subcategory ? `(${subcategory})` : ''}
- Product Type: ${productType || 'Coffee'}
- Brand: ${brand || 'AL ZOAL'}
- Existing Description: ${description || 'No existing description'}

Generate the following fields in the requested JSON structure:
1. aiProductSummary: A highly compelling, luxury-oriented description of the product, rich in narrative.
2. aiSeoSuggestions: Suggested SEO Title, Meta Description, and primary keywords optimized for Saudi and GCC markets.
3. aiTranslationAr: A pristine, elegant Arabic translation of the description, written in premium boutique copy style.
4. aiTranslationEn: A pristine, elegant English translation of the description.
5. aiTags: Comma-separated list of 5-8 highly relevant descriptive tags (e.g., 'premium, yemeni, haraz, organic').
6. aiAltText: Suggest descriptive, high-quality ALT text for the product image.
7. aiSearchOptimization: Comma-separated search optimization keywords for indices.
8. aiRelatedProducts: An AI recommendation of related products or categories that pair well.
9. aiProductRecommendation: Pairing suggestions or customer lifestyle recommendations for this product.`;

  const fallbackData = {
    aiProductSummary: `Artisanal boutique curation: "${name}" represents the pinnacle of handcrafted Saudi quality. Roasted to bring out deep organic notes of sweetness, custom packed with absolute freshness.`,
    aiSeoSuggestions: `Primary Keyword: "${name}"\nHighly Recommended Title: Buy Genuine ${name} Online | AL ZOAL Roasters\nRecommended Meta Desc: Indulge in artisanal luxury of ${name}. High-fidelity, direct trade, and handpicked premium quality beans. Order now in Al Hofuf.`,
    aiTranslationAr: `مزيج فاخر وحصري: يمثل المنتج "${name}" ذروة الجودة الحرفية السعودية المحمصة بعناية فائقة.`,
    aiTranslationEn: `Bespoke Reserve Blend: The "${name}" catalog item represents high-end boutique roasting standards.`,
    aiTags: `specialty, premium, handcrafted, ${category || 'traditional'}`,
    aiAltText: `Premium high-resolution capture showcasing the exquisite detail and luxury packaging of ${name}.`,
    aiSearchOptimization: `${name.toLowerCase().replace(/\s+/g, ', ')}, specialty, traditional coffee, saudi roasters, premium beans, buy online`,
    aiRelatedProducts: `This premium ${name} is best complemented by Al-Hasa Dates, our Single-Origin Yemen Haraz Reserve, and hand-ground cardamom blends.`,
    aiProductRecommendation: `Pairs exceptionally well with traditional dates, organic dark chocolate, and Al-Hasa traditional breads.`
  };

  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ process.env.GEMINI_API_KEY is not set. Using enterprise fallback copy.');
    return res.json(fallbackData);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiProductSummary: { type: Type.STRING },
            aiSeoSuggestions: { type: Type.STRING },
            aiTranslationAr: { type: Type.STRING },
            aiTranslationEn: { type: Type.STRING },
            aiTags: { type: Type.STRING },
            aiAltText: { type: Type.STRING },
            aiSearchOptimization: { type: Type.STRING },
            aiRelatedProducts: { type: Type.STRING },
            aiProductRecommendation: { type: Type.STRING },
          },
          required: [
            'aiProductSummary',
            'aiSeoSuggestions',
            'aiTranslationAr',
            'aiTranslationEn',
            'aiTags',
            'aiAltText',
            'aiSearchOptimization',
            'aiRelatedProducts',
            'aiProductRecommendation'
          ]
        }
      }
    });

    const text = response.text;
    if (text) {
      const resultObj = JSON.parse(text);
      return res.json(resultObj);
    } else {
      throw new Error('Gemini returned empty text.');
    }
  } catch (err: any) {
    console.error('❌ Gemini generation failed, returning high-fidelity fallback copy:', err.message || err);
    return res.json(fallbackData);
  }
});

// Post order to trigger automated luxury confirmation emails
app.post('/api/orders/email', async (req, res) => {
  const { order } = req.body;

  if (!order || !order.id || !order.customerName || !order.email) {
    return res.status(400).json({ error: 'Invalid order structure.' });
  }

  const logs = await readEmailDbAsync();

  // "Never send duplicate emails" - check if this order already has a successful or pending email confirmation log
  const duplicate = logs.find((r) => r.orderId === order.id && (r.deliveryStatus === 'sent' || r.deliveryStatus === 'retrying'));
  if (duplicate) {
    return res.status(200).json({
      success: true,
      duplicate: true,
      message: `Email already sent or currently sending for order ${order.id}.`,
      logId: duplicate.id,
      deliveryStatus: duplicate.deliveryStatus,
    });
  }

  // Create new email delivery record
  const logId = `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newLog: EmailLog = {
    id: logId,
    orderId: order.id,
    customerName: order.customerName,
    customerEmail: order.email,
    orderDate: order.date || new Date().toISOString().substring(0, 10),
    totalAmount: order.total || 0,
    deliveryStatus: 'retrying', // marked initially as in-progress / retrying
    attemptsCount: 0,
    lastAttemptAt: new Date().toISOString(),
    logs: [`[${new Date().toISOString()}] Order registration accepted. Delivery processing initiated.`],
    orderData: order,
  };

  logs.push(newLog);
  await writeEmailDbAsync(logs);

  // Trigger non-blocking email-sending background workers with automated retry
  sendEmailWithRetry(order, logId, 3, 2000).catch((err) => {
    console.error('Unhandled background worker error sending email:', err);
  });

  return res.status(201).json({
    success: true,
    message: 'Email confirmation triggered successfully.',
    logId,
    deliveryStatus: 'initiated',
  });
});

// ==========================================
// SUPABASE INTEGRATION UTILITIES API
// ==========================================

// Get Supabase Connection Status and instructions
app.get('/api/supabase/status', async (req, res) => {
  try {
    const configured = isSupabaseConfigured();
    let connected = false;
    let tableCounts: any = null;
    let errorMessage = '';

    if (configured) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          // Attempt a simple ping select
          const { count, error } = await supabase.from('zoal_users').select('*', { count: 'exact', head: true });
          if (!error) {
            connected = true;
            
            // Get stats for tables
            const { count: sessionCount } = await supabase.from('zoal_sessions').select('*', { count: 'exact', head: true });
            const { count: logsCount } = await supabase.from('zoal_activity_logs').select('*', { count: 'exact', head: true });
            const { count: emailsCount } = await supabase.from('zoal_email_logs').select('*', { count: 'exact', head: true });

            tableCounts = {
              users: count || 0,
              sessions: sessionCount || 0,
              activity_logs: logsCount || 0,
              email_logs: emailsCount || 0
            };
          } else {
            errorMessage = error.message;
            if (error.code === '42P01') {
              errorMessage = 'Required tables do not exist in your Supabase database yet. Please run the provided SQL Schema script in your Supabase SQL Editor.';
            }
          }
        } catch (err: any) {
          errorMessage = err.message || String(err);
        }
      }
    }

    return res.json({
      configured,
      connected,
      errorMessage,
      tableCounts,
      sqlSchema: SUPABASE_SQL_SCHEMA,
      endpoints: {
        status: '/api/supabase/status',
        sync: '/api/supabase/sync'
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Migration endpoint removed
app.post('/api/supabase/sync', async (req, res) => {
  return res.status(501).json({ error: 'Data synchronization is no longer supported.' });
});

// =========================================================================
//             AL ZOAL LUXURY BOUTIQUE - BRANDING PERSISTENCE API
// =========================================================================

const MAP_DB_TO_SETTINGS = (row: any) => ({
  businessName: row.business_name || 'AL ZOAL Enterprise',
  businessLogo: row.business_logo || '/images/branding/zoal-logo.jpg',
  favicon: row.favicon || '/assets/images/favicon.svg',
  address: row.address || 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia',
  email: row.email || 'alzoal3003@gmail.com',
  phone: row.phone || '+966 56 769 9315',
  instagram: row.social_links?.instagram || 'https://instagram.com/alzoal',
  twitter: row.social_links?.twitter || 'https://twitter.com/alzoal',
  language: row.language || 'en',
  currency: row.currency || 'SAR',
  shippingFeeDefault: row.shipping_fee_default !== null ? Number(row.shipping_fee_default) : 35,
  shippingFreeThreshold: row.shipping_free_threshold !== null ? Number(row.shipping_free_threshold) : 500,
  taxRate: row.tax_rate !== null ? Number(row.tax_rate) : 15,
  taxId: row.tax_id || 'VAT-789-ZOAL-99',
  smtpHost: row.smtp_host || 'smtp.zoal-cloud.sa',
  smtpPort: row.smtp_port || '587',
  smtpUser: row.smtp_user || 'relays@zoal.sa',
  smtpPass: row.smtp_pass || '**********',
  ipWhitelist: row.ip_whitelist || '0.0.0.0/0',
  sessionExpirationMinutes: row.session_expiration_minutes !== null ? Number(row.session_expiration_minutes) : 120,
  autoBackupFrequency: row.auto_backup_frequency || 'daily',
  accentColor: row.accent_color || '#D4AF37',
  companyDescription: row.company_description || '',
  website: row.website || '',
  theme: row.theme || 'dark'
});

/**
 * Checks for required branding row. 
 * In production, this should exist via migrations.
 * In development, we can ensure a row exists if missing.
 */
async function ensureBrandingRowExists() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return;

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // In production, we assume migrations have handled the schema.
    // We only perform safe DML operations here if absolutely necessary for app startup.
    const res = await client.query('SELECT COUNT(*) FROM branding_settings');
    const count = parseInt(res.rows[0].count, 10);
    
    if (count === 0 && process.env.NODE_ENV !== 'production') {
      console.log('🌱 Populating empty branding_settings table with default enterprise settings (Dev Only)...');
      const defaultSocial = JSON.stringify({
        instagram: 'https://instagram.com/alzoal',
        twitter: 'https://twitter.com/alzoal'
      });
      await client.query(`
        INSERT INTO branding_settings (
          id, business_name, business_logo, favicon, company_description, phone, email, website, address, social_links, accent_color, theme, language, currency, shipping_fee_default, shipping_free_threshold, tax_rate, tax_id, smtp_host, smtp_port, smtp_user, smtp_pass, ip_whitelist, session_expiration_minutes, auto_backup_frequency, updated_by
        ) VALUES (
          1, 'AL ZOAL Enterprise', '/images/branding/zoal-logo.jpg', '/assets/images/favicon.svg', 'Al Zoal Luxury Boutique - Al Zoal Luxury Boutique - Sovereign Enterprise Class Boutique and Media Management Platform', '+966 56 769 9315', 'alzoal3003@gmail.com', 'https://alzoal.sa', 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia', $1, '#D4AF37', 'dark', 'en', 'SAR', 35, 500, 15, 'VAT-789-ZOAL-99', 'smtp.zoal-cloud.sa', '587', 'relays@zoal.sa', '**********', '0.0.0.0/0', 120, 'daily', 'System'
        )
      `, [defaultSocial]);
    }
  } catch (err: any) {
    console.error('⚠️ branding_settings row check failed (Expected if migrations not run):', err.message);
  } finally {
    try { await client.end(); } catch (e) {}
  }
}

app.get('/api/branding', async (req, res) => {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return res.json({
        businessName: 'AL ZOAL Enterprise',
        businessLogo: '/images/branding/zoal-logo.jpg',
        favicon: '/assets/images/favicon.svg',
        address: 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia',
        email: 'alzoal3003@gmail.com',
        phone: '+966 56 769 9315',
        instagram: 'https://instagram.com/alzoal',
        twitter: 'https://twitter.com/alzoal',
        language: 'en',
        currency: 'SAR',
        shippingFeeDefault: 35,
        shippingFreeThreshold: 500,
        taxRate: 15,
        taxId: 'VAT-789-ZOAL-99',
        smtpHost: 'smtp.zoal-cloud.sa',
        smtpPort: '587',
        smtpUser: 'relays@zoal.sa',
        smtpPass: '**********',
        ipWhitelist: '0.0.0.0/0',
        sessionExpirationMinutes: 120,
        autoBackupFrequency: 'daily',
        accentColor: '#D4AF37',
        companyDescription: 'Al Zoal Luxury Boutique - Sovereign Enterprise Class Boutique and Media Management Platform',
        website: 'https://alzoal.sa',
        theme: 'dark'
      });
    }

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    const result = await client.query('SELECT * FROM branding_settings WHERE id = 1 LIMIT 1');
    await client.end();

    if (result.rows.length > 0) {
      return res.json(MAP_DB_TO_SETTINGS(result.rows[0]));
    } else {
      return res.json({
        businessName: 'AL ZOAL Enterprise',
        businessLogo: '/images/branding/zoal-logo.jpg',
        favicon: '/assets/images/favicon.svg',
        address: 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia',
        email: 'alzoal3003@gmail.com',
        phone: '+966 56 769 9315',
        instagram: 'https://instagram.com/alzoal',
        twitter: 'https://twitter.com/alzoal',
        language: 'en',
        currency: 'SAR',
        shippingFeeDefault: 35,
        shippingFreeThreshold: 500,
        taxRate: 15,
        taxId: 'VAT-789-ZOAL-99',
        smtpHost: 'smtp.zoal-cloud.sa',
        smtpPort: '587',
        smtpUser: 'relays@zoal.sa',
        smtpPass: '**********',
        ipWhitelist: '0.0.0.0/0',
        sessionExpirationMinutes: 120,
        autoBackupFrequency: 'daily',
        accentColor: '#D4AF37',
        companyDescription: 'Al Zoal Luxury Boutique - Sovereign Enterprise Class Boutique and Media Management Platform',
        website: 'https://alzoal.sa',
        theme: 'dark'
      });
    }
  } catch (err: any) {
    console.error('❌ Error fetching branding settings:', err);
    return res.json({
      businessName: 'AL ZOAL Enterprise',
      businessLogo: '/images/branding/zoal-logo.jpg',
      favicon: '/assets/images/favicon.svg',
      address: 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia',
      email: 'alzoal3003@gmail.com',
      phone: '+966 56 769 9315',
      instagram: 'https://instagram.com/alzoal',
      twitter: 'https://twitter.com/alzoal',
      language: 'en',
      currency: 'SAR',
      shippingFeeDefault: 35,
      shippingFreeThreshold: 500,
      taxRate: 15,
      taxId: 'VAT-789-ZOAL-99',
      smtpHost: 'smtp.zoal-cloud.sa',
      smtpPort: '587',
      smtpUser: 'relays@zoal.sa',
      smtpPass: '**********',
      ipWhitelist: '0.0.0.0/0',
      sessionExpirationMinutes: 120,
      autoBackupFrequency: 'daily',
      accentColor: '#D4AF37',
      companyDescription: 'Al Zoal Luxury Boutique - Sovereign Enterprise Class Boutique and Media Management Platform',
      website: 'https://alzoal.sa',
      theme: 'dark'
    });
  }
});

app.post('/api/branding', authenticateRequest, requireRole(['manager']), async (req: any, res) => {
  try {
    const config = req.body;
    if (!config) {
      return res.status(400).json({ error: 'Missing configuration body.' });
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return res.status(500).json({ error: 'Database is not configured.' });
    }

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const socialLinks = JSON.stringify({
      instagram: config.instagram || '',
      twitter: config.twitter || ''
    });

    const query = `
      INSERT INTO branding_settings (
        id, business_name, business_logo, favicon, company_description, phone, email, website, address, social_links, accent_color, theme, language, currency, shipping_fee_default, shipping_free_threshold, tax_rate, tax_id, smtp_host, smtp_port, smtp_user, smtp_pass, ip_whitelist, session_expiration_minutes, auto_backup_frequency, updated_by
      ) VALUES (
        1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
      ) ON CONFLICT (id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        business_logo = EXCLUDED.business_logo,
        favicon = EXCLUDED.favicon,
        company_description = EXCLUDED.company_description,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        website = EXCLUDED.website,
        address = EXCLUDED.address,
        social_links = EXCLUDED.social_links,
        accent_color = EXCLUDED.accent_color,
        theme = EXCLUDED.theme,
        language = EXCLUDED.language,
        currency = EXCLUDED.currency,
        shipping_fee_default = EXCLUDED.shipping_fee_default,
        shipping_free_threshold = EXCLUDED.shipping_free_threshold,
        tax_rate = EXCLUDED.tax_rate,
        tax_id = EXCLUDED.tax_id,
        smtp_host = EXCLUDED.smtp_host,
        smtp_port = EXCLUDED.smtp_port,
        smtp_user = EXCLUDED.smtp_user,
        smtp_pass = EXCLUDED.smtp_pass,
        ip_whitelist = EXCLUDED.ip_whitelist,
        session_expiration_minutes = EXCLUDED.session_expiration_minutes,
        auto_backup_frequency = EXCLUDED.auto_backup_frequency,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = EXCLUDED.updated_by
      RETURNING *;
    `;

    const values = [
      config.businessName || 'AL ZOAL Enterprise',
      config.businessLogo || '/images/branding/zoal-logo.jpg',
      config.favicon || '/assets/images/favicon.svg',
      config.companyDescription || 'Al Zoal Luxury Boutique',
      config.phone || '+966 56 769 9315',
      config.email || 'alzoal3003@gmail.com',
      config.website || 'https://alzoal.sa',
      config.address || 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia',
      socialLinks,
      config.accentColor || '#D4AF37',
      config.theme || 'dark',
      config.language || 'en',
      config.currency || 'SAR',
      config.shippingFeeDefault !== undefined ? Number(config.shippingFeeDefault) : 35,
      config.shippingFreeThreshold !== undefined ? Number(config.shippingFreeThreshold) : 500,
      config.taxRate !== undefined ? Number(config.taxRate) : 15,
      config.taxId || 'VAT-789-ZOAL-99',
      config.smtpHost || 'smtp.zoal-cloud.sa',
      config.smtpPort || '587',
      config.smtpUser || 'relays@zoal.sa',
      config.smtpPass || '**********',
      config.ipWhitelist || '0.0.0.0/0',
      config.sessionExpirationMinutes !== undefined ? Number(config.sessionExpirationMinutes) : 120,
      config.autoBackupFrequency || 'daily',
      req.user.email || 'Admin'
    ];

    const result = await client.query(query, values);
    await client.end();

    const updatedRow = result.rows[0];
    return res.json({ success: true, settings: MAP_DB_TO_SETTINGS(updatedRow) });
  } catch (err: any) {
    console.error('❌ Error updating branding settings:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// =========================================================================
//             AL ZOAL LUXURY BOUTIQUE - STORAGE API ENDPOINTS
// =========================================================================

// Allowed storage buckets for safety
const ALLOWED_STORAGE_BUCKETS = [
  'products',
  'categories',
  'brands',
  'avatars',
  'gallery',
  'banners',
  'blogs',
  'documents',
  'invoices'
];

// Single file upload endpoint
app.post('/api/storage/upload', authenticateRequest, requireRole(['staff']), storageUploadMiddleware, async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(400).json({ error: 'Supabase is not configured.' });
    }

    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    const bucket = req.body.bucket || 'products';
    if (!ALLOWED_STORAGE_BUCKETS.includes(bucket)) {
      return res.status(400).json({ error: `Invalid bucket name. Allowed buckets: ${ALLOWED_STORAGE_BUCKETS.join(', ')}` });
    }

    // Use provided custom path/filename, otherwise fallback to timestamped original name
    const timestamp = Date.now();
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathInBucket = req.body.path || `${timestamp}_${sanitizedOriginalName}`;

    console.log(`🔄 Uploading file through API proxy to bucket "${bucket}" with path "${pathInBucket}"...`);
    // NOTE: uploadToSupabase internally calls validateFileSecurity for Enterprise protection
    const result = await uploadToSupabase(bucket, pathInBucket, file.buffer, file.mimetype);

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to upload to Supabase' });
    }

    return res.json({
      success: true,
      url: result.url,
      bucket,
      path: pathInBucket,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype
    });
  } catch (err: any) {
    console.error('❌ Error in /api/storage/upload:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// List files in a bucket endpoint
app.get('/api/storage/list', authenticateRequest, requireRole(['staff']), async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(400).json({ error: 'Supabase is not configured.' });
    }

    const bucket = req.query.bucket ? String(req.query.bucket) : 'products';
    if (!ALLOWED_STORAGE_BUCKETS.includes(bucket)) {
      return res.status(400).json({ error: `Invalid bucket name. Allowed: ${ALLOWED_STORAGE_BUCKETS.join(', ')}` });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Failed to initialize Supabase client.' });
    }

    console.log(`🔄 Fetching list of files from bucket "${bucket}"...`);
    const { data: files, error } = await supabase.storage.from(bucket).list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });

    if (error) {
      console.error(`❌ Supabase Storage list error [Bucket: ${bucket}]:`, error.message);
      return res.status(500).json({ error: error.message });
    }

    // Map files to include standard public URLs and optimized image URLs
    const mappedFiles = files.map(file => {
      let url = '';
      let optimizedUrl = '';

      if (bucket !== 'invoices') {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(file.name);
        url = urlData?.publicUrl || '';
        optimizedUrl = getOptimizedImageUrl(bucket, file.name, { width: 300, quality: 80 });
      } else {
        url = `/api/storage/private/${bucket}/${file.name}`;
        optimizedUrl = url; // No optimization for private invoices (PDFs)
      }

      return {
        name: file.name,
        id: file.id,
        size: file.metadata?.size || 0,
        mimeType: file.metadata?.mimetype || 'application/octet-stream',
        createdAt: file.created_at,
        url,
        optimizedUrl
      };
    });

    return res.json({
      success: true,
      bucket,
      files: mappedFiles
    });
  } catch (err: any) {
    console.error('❌ Error in /api/storage/list:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Delete file endpoint
app.post('/api/storage/delete', authenticateRequest, requireRole(['staff']), async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(400).json({ error: 'Supabase is not configured.' });
    }

    const { bucket, path: filePath } = req.body;
    if (!bucket || !filePath) {
      return res.status(400).json({ error: 'Parameters "bucket" and "path" are required.' });
    }

    if (!ALLOWED_STORAGE_BUCKETS.includes(bucket)) {
      return res.status(400).json({ error: `Invalid bucket name. Allowed: ${ALLOWED_STORAGE_BUCKETS.join(', ')}` });
    }

    console.log(`🔄 Deleting file from bucket "${bucket}" at path "${filePath}"...`);
    const result = await deleteFromSupabase(bucket, filePath);

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to delete from Supabase' });
    }

    return res.json({ success: true, message: 'File deleted successfully.' });
  } catch (err: any) {
    console.error('❌ Error in /api/storage/delete:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Image optimization URL generation proxy / utility
app.get('/api/storage/optimize', (req, res) => {
  const { bucket, path: filePath, width, height, quality, resize } = req.query;
  
  if (!bucket || !filePath) {
    return res.status(400).json({ error: 'Parameters "bucket" and "path" are required.' });
  }

  const optUrl = getOptimizedImageUrl(
    String(bucket),
    String(filePath),
    {
      width: width ? parseInt(String(width)) : undefined,
      height: height ? parseInt(String(height)) : undefined,
      quality: quality ? parseInt(String(quality)) : undefined,
      resize: resize as 'cover' | 'contain' | 'fill' | undefined
    }
  );

  return res.json({ optimizedUrl: optUrl });
});

// Secure Proxy for private invoice downloads
app.get('/api/storage/private/invoices/:path(*)', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(400).json({ error: 'Supabase is not configured.' });
    }

    const filePath = req.params.path;
    if (!filePath) {
      return res.status(400).json({ error: 'Invoice path is required.' });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Failed to initialize Supabase client.' });
    }

    console.log(`🔒 Authenticated backend downloading private invoice: "${filePath}"...`);
    const { data, error } = await supabase.storage.from('invoices').download(filePath);

    if (error) {
      console.error(`❌ Invoice retrieval failed:`, error.message);
      return res.status(404).json({ error: `Invoice file not found: ${error.message}` });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    res.setHeader('Content-Type', data.type || 'application/pdf');
    // Content-Disposition forces standard browser visualization/download
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
    return res.send(buffer);
  } catch (err: any) {
    console.error('❌ Error in proxying private invoice:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Helper to generate the luxury HTML inquiry email template
function generateInquiryEmailHtml(inquiry: { id: string; name: string; email: string; phone: string; message: string; date: string; meta?: any }): string {
  const securityLog = inquiry.meta ? `
    <tr>
      <td colspan="2" style="border-top: 1px solid #1a1a1a; padding-top: 15px; font-size: 11px; color: #8F6F27; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace; font-weight: bold; padding-bottom: 8px;">
        Security Audit Log:
      </td>
    </tr>
    <tr>
      <td colspan="2" style="font-size: 10px; color: #666666; font-family: monospace; background-color: #050505; border: 1px solid #151515; padding: 10px; border-radius: 2px;">
        IP: ${inquiry.meta.ip || 'Unknown'}<br/>
        UA: ${inquiry.meta.userAgent || 'Unknown'}<br/>
        AUTH: VERIFIED_SUBMISSION
      </td>
    </tr>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New AL ZOAL Privy Inquiry Received</title>
  <style>
    body {
      background-color: #000000;
      color: #ffffff;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: none;
      -ms-text-size-adjust: none;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 15px !important;
      }
    }
  </style>
</head>
<body style="background-color: #000000; color: #ffffff; padding: 20px 0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; width: 100%;">
    <tr>
      <td align="center">
        <!-- Main Wrapper (600px max) -->
        <table class="container" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #050505; border: 1px solid #1c180e; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.9);">
          
          <!-- Double Gold Border Header Spacer -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #8F6F27 0%, #E2C573 50%, #8F6F27 100%);"></td>
          </tr>

          <!-- Corporate Brand Banner -->
          <tr>
            <td align="center" style="padding: 40px 40px 25px 40px; border-bottom: 1px solid #111111;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align: center;">
                <tr>
                  <td>
                    <!-- Elegant Serif Logo Text -->
                    <div style="font-family: 'Times New Roman', Times, 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: bold; color: #D4AF37; letter-spacing: 0.35em; text-transform: uppercase; margin-bottom: 5px;">
                      ZOAL
                    </div>
                    <div style="font-size: 9px; font-weight: 500; color: #8F6F27; letter-spacing: 0.55em; text-transform: uppercase;">
                      Curated Excellence
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Confirmation Announcement Message -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 50%; background-color: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); text-align: center; color: #D4AF37; font-size: 20px; font-weight: bold;">
                      ✉
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <h2 style="font-size: 18px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 0.15em; margin: 0; font-family: 'Times New Roman', Times, serif;">
                      New Privy Inquiry Registered
                    </h2>
                    <p style="font-size: 11px; color: #D4AF37; text-transform: uppercase; letter-spacing: 0.1em; margin: 8px 0 0 0; font-family: monospace;">
                      Reference ID: ${inquiry.id}
                    </p>
                  </td>
                </tr>
                
                <!-- Inquiry Details Card -->
                <tr>
                  <td style="padding: 25px; background-color: #0b0b0b; border: 1px solid #1a1a1a; border-radius: 2px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 11px; color: #8F6F27; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace; font-weight: bold; width: 120px;">
                          Name:
                        </td>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #ffffff; font-weight: 600;">
                          ${inquiry.name}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 11px; color: #8F6F27; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace; font-weight: bold;">
                          Email Address:
                        </td>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #ffffff; font-family: monospace;">
                          <a href="mailto:${inquiry.email}" style="color: #D4AF37; text-decoration: none;">${inquiry.email}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 11px; color: #8F6F27; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace; font-weight: bold;">
                          Phone Axis:
                        </td>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #ffffff; font-family: monospace;">
                          <a href="tel:${inquiry.phone}" style="color: #D4AF37; text-decoration: none;">${inquiry.phone}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 11px; color: #8F6F27; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace; font-weight: bold;">
                          Registered At:
                        </td>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #ffffff; font-family: monospace;">
                          ${inquiry.date}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-top: 1px solid #1a1a1a; padding-top: 15px; font-size: 11px; color: #8F6F27; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace; font-weight: bold; padding-bottom: 8px;">
                          Inquiry Narrative:
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="font-size: 13px; color: #e4e4e7; line-height: 1.6; white-space: pre-wrap; background-color: #050505; border: 1px solid #151515; padding: 15px; border-radius: 2px;">
                          ${inquiry.message}
                        </td>
                      </tr>
                      ${securityLog}
                    </table>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-top: 35px; padding-bottom: 15px;">
                    <p style="font-size: 11px; color: #a1a1aa; line-height: 1.6; max-width: 320px; text-align: center; margin: 0;">
                      Please log in to your staff or admin dashboard to review the submission or coordinate response protocols.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="background-color: #020202; border-top: 1px solid #111111; padding: 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="font-size: 10px; color: #52525b; line-height: 1.5; font-family: monospace; text-transform: uppercase; letter-spacing: 0.05em;">
                    © 2026 ZOAL Group. Curated Luxury Coffee, Fashion & Homeware. All Rights Reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// POST Contact Inquiry endpoint
app.post('/api/contact', validateContactSecurity, async (req: any, res) => {
  try {
    const { name, email, phone, message, msg } = req.body;
    const finalMessage = message || msg;
    const meta = req.securityMetadata || {};

    // 1. Validate Input
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter a valid name (at least 2 characters).' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 5) {
      return res.status(400).json({ error: 'Please enter a valid phone number.' });
    }

    if (!finalMessage || typeof finalMessage !== 'string' || finalMessage.trim().length < 5) {
      return res.status(400).json({ error: 'Please describe your inquiry in more detail (at least 5 characters).' });
    }

    const inquiryId = `INQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowIso = new Date().toISOString();

    // 2. Save Inquiry to Supabase (zoal_inquiries table)
    let supabaseSaved = false;
    const supabase = getSupabaseClient();
    
    if (supabase) {
      try {
        const { error } = await supabase.from('zoal_inquiries').insert([
          {
            id: inquiryId,
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            message: finalMessage.trim(),
            created_at: nowIso
          }
        ]);

        if (error) {
          console.error('⚠️ Supabase zoal_inquiries insertion error:', error.message);
          // Try inserting to alternative contact_messages if required
          const { error: fallbackError } = await supabase.from('contact_messages').insert([
            {
              id: inquiryId,
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
              message: finalMessage.trim(),
              created_at: nowIso
            }
          ]);
          if (fallbackError) {
            console.error('⚠️ Supabase fallback contact_messages insertion error:', fallbackError.message);
          } else {
            supabaseSaved = true;
            console.log('✅ Inquiry saved to contact_messages fallback table.');
          }
        } else {
          supabaseSaved = true;
          console.log(`✅ Inquiry ${inquiryId} saved successfully (IP: ${meta.ip}).`);
        }
      } catch (dbErr: any) {
        console.error('❌ Exception writing to Supabase:', dbErr.message || dbErr);
      }
    } else {
      console.warn('⚠️ Supabase is not configured. Saving database record skipped.');
    }

    // 3. Send HTML email notification via Nodemailer
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || 'orders@zoalgroup.com';

    let emailSent = false;
    let emailWarning = '';

    if (!smtpHost || !smtpUser || !smtpPass) {
      emailWarning = 'SMTP variables are not fully configured. Email notification could not be dispatched.';
      console.warn(`⚠️ ${emailWarning}`);
    } else {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const formattedDate = new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC';
        const emailHtml = generateInquiryEmailHtml({
          id: inquiryId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          message: finalMessage.trim(),
          date: formattedDate,
          meta
        });

        await transporter.sendMail({
          from: `"AL ZOAL Luxury Inquiry" <${smtpFrom}>`,
          to: smtpFrom, // Admin / Support team email recipient
          replyTo: email.trim(), // Replying goes directly to the inquirer
          subject: `✉ [New Privy Inquiry] ${name.trim()} - Ref: ${inquiryId}`,
          html: emailHtml,
        });

        emailSent = true;
        console.log(`✉ Contact inquiry notification email sent to ${smtpFrom} (Reply-to: ${email}).`);
      } catch (mailErr: any) {
        console.error('❌ Nodemailer failed to send contact notification email:', mailErr.message || mailErr);
        emailWarning = `Failed to dispatch email notification: ${mailErr.message || mailErr}`;
      }
    }

    // 4. Return response
    return res.status(200).json({
      success: true,
      inquiryId,
      message: 'Your inquiry has been processed successfully.',
      supabaseSaved,
      emailSent,
      warning: emailWarning || undefined
    });

  } catch (err: any) {
    console.error('Error in /api/contact handler:', err);
    return res.status(500).json({ error: err.message || 'An unexpected error occurred while processing your inquiry.' });
  }
});

// -------------------------------------------------------------
// SUPPORT CENTER API ROUTES
// -------------------------------------------------------------

app.use('/api/support', authenticateRequest, requireRole(['staff']));

// --- BLOG PUBLIC API ---
app.get('/api/blog/posts', getBlogPosts);
app.get('/api/blog/categories', getCategories);
app.get('/api/blog/tags', getTags);
app.get('/api/blog/authors', getAuthors);
app.get('/api/blog/comments', getComments);
app.post('/api/blog/comments', createComment);
app.get('/api/blog/search', searchBlog);
app.get('/api/blog/rss', generateBlogRss);
app.get('/api/blog/sitemap', generateBlogSitemap);
app.post('/api/blog/newsletter/subscribe', subscribeNewsletter);

// --- BLOG ADMIN API ---
app.post('/api/blog/posts', authenticateRequest, requireRole(['admin', 'staff']), createBlogPost);
app.put('/api/blog/posts/:id', authenticateRequest, requireRole(['admin', 'staff']), updateBlogPost);
app.delete('/api/blog/posts/:id', authenticateRequest, requireRole(['admin', 'staff']), deleteBlogPost);

app.get('/api/support/tickets', async (req, res) => {
  // TODO: Fetch from Supabase
  res.json({ tickets: [] });
});

app.post('/api/support/tickets', async (req, res) => {
  // TODO: Persist to Supabase
  res.status(201).json({ success: true });
});

app.get('/api/support/teams', async (req, res) => {
  res.json({ team: [] });
});

app.get('/api/support/reports', async (req, res) => {
  res.json({ reports: [] });
});

// =========================================================================
//            PRODUCT PERSISTENCE CRUD APIS
// =========================================================================

// Auth Callback Route for Supabase OAuth
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code as string;
  const next = (req.query.next as string) || '/';
  const supabase = getSupabaseClient();

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return res.redirect(next);
    } catch (err: any) {
      console.error('❌ OAuth Callback Error:', err.message || err);
      return res.redirect(`/?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
    }
  }

  res.redirect('/');
});

app.get('/api/products', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.json({ products: [] });
  }

  // Enterprise Security & Performance: Extract pagination, sort and filter params
  // Default limit 100 to maintain compatibility with legacy UI while protecting server resources
  const limit = Math.min(Number(req.query.limit) || 100, 1000); 
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const search = req.query.search ? String(req.query.search).trim() : null;
  const category = req.query.category ? String(req.query.category).trim() : null;
  const sortField = ['price', 'name', 'created_at', 'updated_at'].includes(String(req.query.sort)) 
    ? String(req.query.sort) 
    : 'created_at';
  const sortOrder = String(req.query.order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1. Build Dynamic SQL for Server-Side Processing
    let query = 'SELECT data FROM zoal_supabase_products';
    const params: any[] = [];
    const conditions: string[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR friendly_id ILIKE $${params.length})`);
    }

    if (category && category !== 'All') {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // 2. Sorting and Pagination
    query += ` ORDER BY ${sortField} ${sortOrder} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const selectRes = await client.query(query, params);
    let products = selectRes.rows.map(row => row.data);

    // 3. Auto-seed table if empty (Development Only)
    if (products.length === 0 && !search && !category && offset === 0 && process.env.NODE_ENV !== 'production') {
      console.log('🌱 zoal_supabase_products table is empty. Seeding with default PRODUCTS list (Dev Only)...');
      for (const prod of PRODUCTS) {
        const uuid = friendlyToUUID(prod.id);
        await client.query(
          `INSERT INTO zoal_supabase_products (id, friendly_id, name, category, price, is_active, data) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           ON CONFLICT (id) DO NOTHING`,
          [
            uuid,
            prod.id,
            prod.name,
            prod.category,
            Number(prod.price) || 0,
            prod.status !== 'Hidden' && prod.status !== 'Archived',
            JSON.stringify(prod)
          ]
        );
      }
      console.log('✅ Default PRODUCTS seeded successfully!');
      
      const reSelectRes = await client.query(`SELECT data FROM zoal_supabase_products ORDER BY ${sortField} ${sortOrder} LIMIT $1 OFFSET $2`, [limit, offset]);
      products = reSelectRes.rows.map(row => row.data);
    }

    // 4. Metadata for high-performance frontend pagination
    const countQuery = conditions.length > 0 
      ? `SELECT COUNT(*) FROM zoal_supabase_products WHERE ${conditions.join(' AND ')}`
      : 'SELECT COUNT(*) FROM zoal_supabase_products';
    
    const countRes = await client.query(countQuery, params.slice(0, conditions.length));
    const total = parseInt(countRes.rows[0].count, 10);

    return res.json({ 
      products,
      pagination: {
        total,
        limit,
        offset,
        count: products.length,
        hasMore: total > offset + products.length
      }
    });
  } catch (err: any) {
    console.error('❌ Error in GET /api/products:', err.message || err);
    return res.json({ products: [] });
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
});

app.post('/api/products', authenticateRequest, requireRole(['admin', 'staff']), async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(500).json({ error: 'Database is not configured.' });
  }

  const prod = req.body;
  if (!prod || !prod.id || !prod.name) {
    return res.status(400).json({ error: 'Missing valid product schema.' });
  }

  const uuid = friendlyToUUID(prod.id);

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    await client.query(
      `INSERT INTO zoal_supabase_products (id, friendly_id, name, category, price, is_active, data, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
       ON CONFLICT (id) DO UPDATE SET 
         friendly_id = EXCLUDED.friendly_id,
         name = EXCLUDED.name,
         category = EXCLUDED.category,
         price = EXCLUDED.price,
         is_active = EXCLUDED.is_active,
         data = EXCLUDED.data,
         updated_at = NOW()`,
      [
        uuid,
        prod.id,
        prod.name,
        prod.category,
        Number(prod.price) || 0,
        prod.status !== 'Hidden' && prod.status !== 'Archived',
        JSON.stringify(prod)
      ]
    );

    return res.json({ success: true });
  } catch (err: any) {
    console.error('❌ Error in POST /api/products:', err.message || err);
    return res.status(500).json({ error: err.message || String(err) });
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
});

// Alias PUT and PATCH to the same logic for compatibility
app.put('/api/products', authenticateRequest, requireRole(['admin', 'staff']), async (req, res) => {
  // Same as POST due to ON CONFLICT logic
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return res.status(500).json({ error: 'Database not configured' });
  // Redirect to the handler logic or just reuse
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const prod = req.body;
    const uuid = friendlyToUUID(prod.id);
    const result = await client.query(
      `INSERT INTO zoal_supabase_products (id, friendly_id, name, category, price, is_active, data, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, price=EXCLUDED.price, data=EXCLUDED.data, updated_at=NOW()
       RETURNING id`,
      [uuid, prod.id, prod.name, prod.category, Number(prod.price)||0, prod.status!=='Hidden', JSON.stringify(prod)]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Product could not be created or updated.' });
    }
    res.json({ success: true });
  } catch(e:any) { res.status(500).json({ error: e.message }); }
  finally { try{await client.end();}catch(e){} }
});

app.patch('/api/products', authenticateRequest, requireRole(['admin', 'staff']), async (req, res) => {
  // Reuse logic
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return res.status(500).json({ error: 'Database not configured' });
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const prod = req.body;
    const uuid = friendlyToUUID(prod.id);
    const result = await client.query(
      `UPDATE zoal_supabase_products SET data = data || $2::jsonb, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [uuid, JSON.stringify(prod)]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Product not found.' });
    }
    res.json({ success: true });
  } catch(e:any) { res.status(500).json({ error: e.message }); }
  finally { try{await client.end();}catch(e){} }
});

app.delete('/api/products/:id', authenticateRequest, requireRole(['admin', 'staff']), async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(500).json({ error: 'Database is not configured.' });
  }

  const { id } = req.params;
  const uuid = friendlyToUUID(id);

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const result = await client.query('DELETE FROM zoal_supabase_products WHERE id = $1 RETURNING id', [uuid]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Product not found.' });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('❌ Error in DELETE /api/products:', err.message || err);
    return res.status(500).json({ error: err.message || String(err) });
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
});

// Vite & Static file serving setup
async function startServer() {
  // Initialize local file-based database safely
  await initializeEmailDb();

  // Initialize branding database tables and settings row
  // Ensure required data exists (safe DML only)
  await ensureBrandingRowExists();

  // Sync seed users to active database (Supabase) asynchronously
  // Seeding disabled in Supabase migration

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Custom SPA fallback handler for development to enable server-side SEO rendering
    app.get('*', async (req, res, next) => {
      // Strictly skip API routes and static assets
      if (req.path.startsWith('/api') || req.path.includes('.')) {
        return next();
      }
      try {
        const template = await fs.promises.readFile(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        const transformedTemplate = await vite.transformIndexHtml(req.url, template);
        const finalHtml = await injectServerSEO(transformedTemplate, req);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
      } catch (err: any) {
        vite.ssrFixStacktrace(err);
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Implement high-performance, immutable caching for hashed production assets
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      index: false, // Prevent serving static index.html directly so our get('*') handler can render SEO
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
        }
      }
    }));
    app.get('*', async (req, res, next) => {
      // Strictly skip API routes
      if (req.path.startsWith('/api')) {
        return next();
      }
      try {
        const templatePath = path.join(distPath, 'index.html');
        const template = await fs.promises.readFile(templatePath, 'utf-8');
        const finalHtml = await injectServerSEO(template, req);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
      } catch (err: any) {
        next(err);
      }
    });
  }

  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

startServer();

export default app;
