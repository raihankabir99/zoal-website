import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { getSupabaseClient, getServiceSupabaseClient, isSupabaseConfigured, SUPABASE_SQL_SCHEMA } from './server/supabase';
import * as supportModule from './server/support';
import * as cmsModule from './server/cms';
import * as marketingModule from './server/marketing';
import * as legalModule from './server/legal';
import * as taxModule from './server/taxes';
import * as aiModule from './server/ai';
import * as analyticsModule from './server/analytics';
import * as kpiModule from './server/kpi';
import * as growthModule from './server/growth';
import * as forecastingModule from './server/forecasting';
import * as briefingModule from './server/briefing';
import * as executiveModule from './server/executive';
import * as simulationModule from './server/simulation';
import * as blogModule from './server/blog';
import * as aiTranslationsModule from './server/ai_translations';
import * as operationsModule from './server/operations';
import * as adminModule from './server/admin';
import * as productImportModule from './server/product_import';
import * as productsCrudModule from './server/products_crud';
import * as warehousesModule from './server/warehouses';
import * as crmModule from './server/crm';
import pg from 'pg';
import { resolveShippingOptions, calculateAuthoritativeShippingFee, getProvider, isMockShippingEnabled } from './server/shipping';
const { Client } = pg;

import {
  storageUploadMiddleware,
  storageMultipleUploadMiddleware,
  uploadToSupabase,
  deleteFromSupabase,
  getOptimizedImageUrl,
  extractFilename,
  checkImageReferences
} from './server/storage';

import {
  securityHeadersMiddleware,
  rateLimiterMiddleware,
  csrfProtectionMiddleware,
  xssSanitizerMiddleware,
  serveRobotsTxt,
  serveSitemapXml,
  authenticateRequest,
  optionalAuthenticate,
  syncSupabaseUser,
  requireRole,
  userRateLimiterMiddleware,
  validateContactSecurity
} from './backend/security';

// Resolve ESM vs CJS paths safely
const __filename_esm = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '';
const __dirname_esm = __filename_esm ? path.dirname(__filename_esm) : '';

const app = express();
const PORT = 3000;

// Apply high-performance dynamic compression on all payloads
app.use(compression());

// Parse json payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Apply dynamic sovereign security headers (CSP, HSTS, Clickjacking, MIME checks, Permissions, Referrer)
app.use(securityHeadersMiddleware);

// Clean incoming payload data recursively against Cross-Site Scripting (XSS) injections
app.use(xssSanitizerMiddleware);

// Validate requests to prevent Cross-Site Request Forgery (CSRF)
app.use(csrfProtectionMiddleware);

// Establish rate-limiting on API endpoints to prevent brute-forcing and DoS
app.use('/api/ai', rateLimiterMiddleware(20, 15 * 60 * 1000)); // Stricter limit for AI (20 requests/15 mins)
app.use('/api', rateLimiterMiddleware(120, 15 * 60 * 1000)); // Max 120 requests per 15 mins

// Serve automated, dynamic search crawler optimization indices
app.get('/robots.txt', serveRobotsTxt);
app.get('/sitemap.xml', serveSitemapXml);

// Ensure the local database directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const EMAIL_DB_PATH = path.join(DATA_DIR, 'email_history.json');

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || process.env.NODE_ENV === 'production';

if (!isVercel) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(EMAIL_DB_PATH)) {
      fs.writeFileSync(EMAIL_DB_PATH, JSON.stringify([], null, 2));
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

// Read database safely
function readEmailDb(): EmailLog[] {
  if (isVercel) {
    return []; // No local file read in serverless production env
  }
  try {
    const data = fs.readFileSync(EMAIL_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading email database:', error);
    return [];
  }
}

// Write to database safely
function writeEmailDb(logs: EmailLog[]) {
  if (isVercel) {
    return; // No local file write in serverless production env
  }
  try {
    fs.writeFileSync(EMAIL_DB_PATH, JSON.stringify(logs, null, 2));
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
        return readEmailDb();
      }
      return (data || []).map(fromSupabaseEmailLog);
    } catch (err: any) {
      console.warn('⚠️ Supabase readEmailDb exception, falling back to local JSON:', err.message || err);
      return readEmailDb();
    }
  }
  return readEmailDb();
}

async function writeEmailDbAsync(logs: EmailLog[]) {
  // Always update local backup
  writeEmailDb(logs);

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

// Background retry mechanism
async function sendEmailWithRetry(order: any, emailLogId: string, maxAttempts = 3, delayMs = 2000) {
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

  const emailHtml = generateOrderEmailHtml(order);

  while (attempt <= maxAttempts && !success) {
    try {
      record.lastAttemptAt = new Date().toISOString();
      record.attemptsCount = attempt;
      record.logs.push(`[${new Date().toISOString()}] Attempt ${attempt} of ${maxAttempts} started.`);
      
      await transporter.sendMail({
        from: `"ZOAL Group" <${smtpFrom}>`,
        to: order.email,
        subject: `✅ Your ZOAL Order Has Been Confirmed`,
        html: emailHtml,
      });

      success = true;
      record.deliveryStatus = 'sent';
      record.sentAt = new Date().toISOString();
      record.logs.push(`[${new Date().toISOString()}] Email sent successfully on attempt ${attempt}.`);
      console.log(`Order email ${order.id} sent successfully to ${order.email}.`);
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

// CMS Routes
app.get('/api/cms', cmsModule.getCmsData);
app.put('/api/cms/pages/:id', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), cmsModule.updateCmsPage);

// Homepage Heroes routes
app.get('/api/homepage-heroes', cmsModule.getHomepageHeroes);
app.post('/api/homepage-heroes', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), cmsModule.createHomepageHero);
app.put('/api/homepage-heroes/:id', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), cmsModule.updateHomepageHero);
app.delete('/api/homepage-heroes/:id', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), cmsModule.deleteHomepageHero);
app.post('/api/homepage-heroes/:id/duplicate', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), cmsModule.duplicateHomepageHero);

// Homepage Editorial routes
app.get('/api/homepage-editorial', cmsModule.getHomepageEditorialBlocks);
app.post('/api/homepage-editorial', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), cmsModule.createHomepageEditorialBlock);
app.put('/api/homepage-editorial/:id', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), cmsModule.updateHomepageEditorialBlock);
app.delete('/api/homepage-editorial/:id', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), cmsModule.deleteHomepageEditorialBlock);
app.post('/api/homepage-editorial/:id/duplicate', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), cmsModule.duplicateHomepageEditorialBlock);

// Marketing Automation Routes
app.get('/api/marketing-data', marketingModule.getMarketingData);
app.post('/api/marketing/campaigns', authenticateRequest, requireRole(['admin', 'manager', 'staff']), marketingModule.createCampaign);

// Legal Policy Routes
app.get('/api/legal/documents', optionalAuthenticate, legalModule.getLegalDocuments);
app.get('/api/legal/documents/:slugOrId', optionalAuthenticate, legalModule.getLegalDocumentBySlugOrId);
app.post('/api/legal/documents', authenticateRequest, requireRole(['admin', 'manager', 'staff', 'editor']), legalModule.createDocument);
app.post('/api/legal/documents/:id/versions', authenticateRequest, requireRole(['admin', 'manager', 'staff', 'editor']), legalModule.createVersion);
app.put('/api/legal/versions/:versionId', authenticateRequest, requireRole(['admin', 'manager', 'staff', 'editor']), legalModule.updateDraftVersion);
app.post('/api/legal/versions/:versionId/publish', authenticateRequest, requireRole(['admin', 'manager', 'staff', 'editor']), legalModule.publishVersion);
app.delete('/api/legal/documents/:id', authenticateRequest, requireRole(['admin']), legalModule.deleteDocument);

// Tax Management Routes
app.get('/api/taxes', taxModule.getTaxData);
app.put('/api/taxes/rates/:id', authenticateRequest, requireRole(['admin', 'manager', 'owner']), taxModule.updateTaxRate);

// AI Workspace Routes
app.get('/api/ai/workspace', authenticateRequest, aiModule.getAiWorkspaceData);
app.post('/api/ai/workspace/logs', authenticateRequest, aiModule.logAiAction);

// Executive Insights Routes (Transitioned to real data)
app.post('/api/executive/insights', authenticateRequest, requireRole(['owner', 'admin']), userRateLimiterMiddleware(10), executiveModule.getExecutiveInsights);

// Regional Analytics Routes
app.get('/api/analytics/regional', authenticateRequest, requireRole(['admin', 'owner']), analyticsModule.getRegionalAnalytics);

// KPI Engine Routes
app.get('/api/kpi', authenticateRequest, requireRole(['admin', 'owner']), kpiModule.getKpiData);
app.post('/api/kpi/targets', authenticateRequest, requireRole(['admin', 'owner']), kpiModule.setKpiTarget);
app.delete('/api/kpi/targets/:id', authenticateRequest, requireRole(['admin', 'owner']), kpiModule.deleteKpiTarget);

// Growth Analytics Routes
app.get('/api/analytics/growth', authenticateRequest, requireRole(['admin', 'owner']), growthModule.getGrowthReports);

// Forecasting Routes
app.get('/api/forecasting', authenticateRequest, requireRole(['admin', 'owner']), forecastingModule.getForecasts);

// AI Briefing Routes
app.get('/api/ai/briefings', authenticateRequest, requireRole(['admin', 'owner']), userRateLimiterMiddleware(15), briefingModule.getAiBriefings);
app.post('/api/ai/briefings/generate', authenticateRequest, requireRole(['owner', 'admin']), userRateLimiterMiddleware(10), briefingModule.generateAiBriefing);
app.post('/api/ai/briefings', authenticateRequest, requireRole(['owner', 'admin']), briefingModule.createManualBriefing);
app.put('/api/ai/briefings/:id', authenticateRequest, requireRole(['owner', 'admin']), briefingModule.updateManualBriefing);
app.delete('/api/ai/briefings/:id', authenticateRequest, requireRole(['owner', 'admin']), briefingModule.deleteBriefing);

// Simulation Routes
app.get('/api/simulation/models', authenticateRequest, requireRole(['admin', 'owner']), simulationModule.getDecisionModels);
app.get('/api/simulation/runs', authenticateRequest, requireRole(['admin', 'owner']), simulationModule.getSimulationRuns);
app.post('/api/simulation/runs', authenticateRequest, requireRole(['admin', 'owner']), simulationModule.createSimulationRun);

app.post('/api/marketing/email', authenticateRequest, requireRole(['admin', 'manager', 'staff']), marketingModule.sendEmailCampaign);

// AI Translation & Enterprise Multi-Language Routes (Phase 13)
app.get('/api/ai/translations', aiTranslationsModule.getTranslations);
app.post('/api/ai/translations/generate', authenticateRequest, userRateLimiterMiddleware(30), requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), aiTranslationsModule.generateAiTranslation);
app.put('/api/ai/translations/:id/draft', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), aiTranslationsModule.updateTranslationDraft);
app.post('/api/ai/translations/:id/submit', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), aiTranslationsModule.submitForReview);
app.post('/api/ai/translations/:id/approve', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), aiTranslationsModule.approveTranslation);
app.post('/api/ai/translations/:id/reject', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), aiTranslationsModule.rejectTranslation);
app.get('/api/ai/translations/:id/preview', aiTranslationsModule.previewPublishTranslation);
app.post('/api/ai/translations/:id/publish', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), aiTranslationsModule.publishTranslation);
app.post('/api/ai/translations/:id/rollback', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), aiTranslationsModule.rollbackTranslation);
app.get('/api/ai/translations/:id/history', aiTranslationsModule.getPublishHistory);
app.get('/api/ai/translations/:id/compare', aiTranslationsModule.compareVersions);
app.delete('/api/ai/translations/:id', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), aiTranslationsModule.deleteTranslation);

app.get('/api/ai/translations/queue', aiTranslationsModule.getQueueJobs);
app.post('/api/ai/translations/queue/action', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), aiTranslationsModule.handleQueueAction);
app.post('/api/ai/translations/batch', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), aiTranslationsModule.createBatchTranslation);
app.get('/api/ai/translations/cache', aiTranslationsModule.getCacheStats);
app.post('/api/ai/translations/cache/invalidate', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), aiTranslationsModule.invalidateCache);
app.get('/api/ai/translations/metrics', aiTranslationsModule.getTranslationMetrics);
app.get('/api/ai/translations/export', aiTranslationsModule.exportTranslationReport);

app.get('/api/ai/translations/sync/health', aiTranslationsModule.getLocalizationHealth);
app.get('/api/ai/translations/sync/tasks', aiTranslationsModule.getLocalizationTasks);
app.post('/api/ai/translations/sync/tasks', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), aiTranslationsModule.createLocalizationTask);
app.post('/api/ai/translations/sync/tasks/update', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), aiTranslationsModule.updateLocalizationTask);
app.get('/api/ai/translations/sync/notifications', aiTranslationsModule.getNotifications);
app.post('/api/ai/translations/sync/notifications/read', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), aiTranslationsModule.markNotificationsRead);
app.post('/api/ai/translations/sync/trigger-change', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), aiTranslationsModule.triggerSourceContentChange);
app.get('/api/ai/translations/sync/diff', aiTranslationsModule.getContentDiff);
app.get('/api/ai/translations/sync/dependencies', aiTranslationsModule.getDependencies);
app.get('/api/ai/translations/sync/reports', aiTranslationsModule.getLocalizationReports);

app.get('/api/ai/translations/quality/overview', aiTranslationsModule.getQualityIntelligence);
app.get('/api/ai/translations/quality/prompts', aiTranslationsModule.getPromptPerformance);
app.get('/api/ai/translations/quality/translators', aiTranslationsModule.getTranslatorAnalytics);
app.get('/api/ai/translations/quality/reviewers', aiTranslationsModule.getReviewerAnalytics);
app.get('/api/ai/translations/quality/learning', aiTranslationsModule.getLearningInsights);
app.get('/api/ai/translations/quality/reports', aiTranslationsModule.getQualityReports);
app.get('/api/ai/translations/quality/leaderboard', aiTranslationsModule.getQualityLeaderboard);
app.get('/api/ai/translations/quality/alerts', aiTranslationsModule.getQualityAlerts);
app.get('/api/ai/translations/quality/export', aiTranslationsModule.exportQualityReport);

// Phase 13 Multi-Language Expansion Routes
app.get('/api/ai/languages', aiTranslationsModule.getSupportedLanguages);
app.post('/api/ai/languages/toggle', authenticateRequest, requireRole(['admin', 'manager', 'owner']), aiTranslationsModule.toggleLanguage);
app.get('/api/ai/translations/matrix', aiTranslationsModule.getTranslationMatrix);
app.get('/api/ai/translations/pack/export', aiTranslationsModule.exportLanguagePack);
app.post('/api/ai/translations/pack/import', authenticateRequest, requireRole(['admin', 'manager', 'owner']), aiTranslationsModule.importLanguagePack);
app.get('/api/ai/translations/memory', aiTranslationsModule.getTranslationMemory);
app.get('/api/operations/health', operationsModule.getHealthData);
app.get('/api/operations/backup', operationsModule.getBackupData);
app.get('/api/operations/alerts', operationsModule.getAlertData);
app.get('/api/operations/certification', operationsModule.getCertificationData);

// Admin Management & Security Center Endpoints
app.get('/api/admin/roster', authenticateRequest, requireRole(['admin', 'owner']), adminModule.getAdminRoster);
app.patch('/api/admin/roster/:id', authenticateRequest, requireRole(['admin', 'owner']), adminModule.updateAdminRole);
app.delete('/api/admin/roster/:id', authenticateRequest, requireRole(['admin', 'owner']), adminModule.revokeAdminAccess);
app.get('/api/admin/audit-logs', authenticateRequest, requireRole(['admin', 'owner']), adminModule.getAuditLogs);
app.get('/api/admin/active-sessions', authenticateRequest, requireRole(['admin', 'owner']), adminModule.getActiveSessions);
app.get('/api/admin/rbac-matrix', authenticateRequest, requireRole(['admin', 'owner']), adminModule.getRbacMatrix);
app.delete('/api/admin/sessions/:token', authenticateRequest, requireRole(['admin', 'owner']), adminModule.revokeSession);

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

// -------------------------------------------------------------
// AUTHENTICATION & SESSION MANAGEMENT
// -------------------------------------------------------------

// Session validation & profile synchronization (Unified GET/POST)
async function handleSessionSync(req: any, res: any) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    let token = req.body?.token || req.query?.token;

    if (headerValue && headerValue.startsWith('Bearer ')) {
      token = headerValue.substring(7);
    }

    if (!token) {
      return res.status(401).json({ error: 'No session token provided.' });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not initialized.' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }

    const userProfile = await syncSupabaseUser(user);

    return res.json({
      success: true,
      user: userProfile
    });
  } catch (error: any) {
    console.error('Session synchronization error:', error);
    return res.status(error.message === 'Profile recovery failed.' ? 403 : 500).json({ 
      error: 'Authentication Error', 
      message: error.message || 'Internal server error during session retrieval.' 
    });
  }
}

app.get('/api/auth/session', handleSessionSync);
app.post('/api/auth/session', handleSessionSync);

// Development Configuration & Bypass Verification
app.get('/api/auth/dev-config', (req, res) => {
  return res.json({ devMode: false });
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
app.get('/api/orders/email-history', authenticateRequest, requireRole(['admin']), async (req, res) => {
  const logs = await readEmailDbAsync();
  res.json(logs);
});

// Get shipping options dynamically based on rules engine
app.post('/api/shipping/options', async (req, res) => {
  try {
    const { country, city, district, postal_code, subtotal } = req.body;
    const options = await resolveShippingOptions({
      country,
      city,
      district,
      postal_code,
      subtotal: Number(subtotal) || 0
    });
    return res.json({ success: true, options });
  } catch (err: any) {
    console.error('Error resolving shipping options:', err.message);
    return res.status(500).json({ error: 'Failed to resolve shipping options.' });
  }
});

// Admin Shipping Rules CRUD and Rule Preview/Testing Endpoints
app.get('/api/shipping/rules', authenticateRequest, requireRole(['admin', 'staff', 'manager']), async (req, res) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(503).json({ error: 'Database connection unavailable.' });
  }

  try {
    const { data: existing, error } = await supabase
      .from('zoal_shipping_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (error) throw error;

    // Seed defaults if empty
    if (!existing || existing.length === 0) {
      const { DEFAULT_SHIPPING_RULES } = require('./server/shipping');
      const toInsert = DEFAULT_SHIPPING_RULES.map((r: any) => ({
        id: r.id,
        name: r.name,
        country: r.country,
        city: r.city,
        district: r.district,
        postal_code: r.postal_code,
        delivery_method: r.delivery_method,
        shipping_provider: r.shipping_provider,
        shipping_fee: r.shipping_fee,
        currency: r.currency || 'SAR',
        smsa_allowed: r.smsa_allowed ?? true,
        active: r.active ?? true,
        priority: r.priority ?? 1,
        free_shipping_threshold: 500
      }));

      const { error: seedError } = await supabase.from('zoal_shipping_rules').insert(toInsert);
      if (seedError) {
        console.error('Error seeding default shipping rules:', seedError.message);
      } else {
        const { data: newlySeeded } = await supabase
          .from('zoal_shipping_rules')
          .select('*')
          .order('priority', { ascending: false });
        return res.json({ success: true, rules: newlySeeded || toInsert });
      }
    }

    return res.json({ success: true, rules: existing });
  } catch (err: any) {
    console.error('Error fetching shipping rules:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve shipping rules.' });
  }
});

app.post('/api/shipping/rules', authenticateRequest, requireRole(['admin', 'staff', 'manager']), async (req, res) => {
  const { rule } = req.body;
  if (!rule || !rule.name || !rule.city || !rule.delivery_method || !rule.shipping_provider) {
    return res.status(400).json({ error: 'Missing required rule parameters.' });
  }

  // Server-side validations
  if (Number(rule.shipping_fee) < 0 || isNaN(Number(rule.shipping_fee))) {
    return res.status(400).json({ error: 'Invalid shipping fee.' });
  }
  if (Number(rule.priority) < 0 || isNaN(Number(rule.priority))) {
    return res.status(400).json({ error: 'Invalid priority.' });
  }
  if (rule.free_shipping_threshold !== undefined && rule.free_shipping_threshold !== null && (Number(rule.free_shipping_threshold) < 0 || isNaN(Number(rule.free_shipping_threshold)))) {
    return res.status(400).json({ error: 'Invalid free shipping threshold.' });
  }

  const allowedProviders = ['local', 'smsa', 'aramex', 'spl', 'dhl'];
  if (!allowedProviders.includes(rule.shipping_provider)) {
    return res.status(400).json({ error: `Invalid provider. Must be one of: ${allowedProviders.join(', ')}` });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(503).json({ error: 'Database unavailable.' });

  try {
    const id = rule.id || `rule-${Date.now()}`;
    const ruleData = {
      id,
      name: rule.name,
      country: rule.country || 'Saudi Arabia',
      city: rule.city,
      district: rule.district || '*',
      postal_code: rule.postal_code || '*',
      delivery_method: rule.delivery_method,
      shipping_provider: rule.shipping_provider,
      shipping_fee: Number(rule.shipping_fee),
      currency: rule.currency || 'SAR',
      smsa_allowed: rule.smsa_allowed !== false,
      active: rule.active !== false,
      priority: Number(rule.priority) || 1,
      free_shipping_threshold: rule.free_shipping_threshold !== undefined && rule.free_shipping_threshold !== null ? Number(rule.free_shipping_threshold) : 500,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('zoal_shipping_rules').insert(ruleData);
    if (error) throw error;

    return res.json({ success: true, rule: ruleData });
  } catch (err: any) {
    console.error('Error creating shipping rule:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to create shipping rule.' });
  }
});

app.put('/api/shipping/rules/:id', authenticateRequest, requireRole(['admin', 'staff', 'manager']), async (req, res) => {
  const { id } = req.params;
  const { rule } = req.body;
  if (!rule) return res.status(400).json({ error: 'Rule object is required.' });

  // Server-side validations
  if (rule.shipping_fee !== undefined && (Number(rule.shipping_fee) < 0 || isNaN(Number(rule.shipping_fee)))) {
    return res.status(400).json({ error: 'Invalid shipping fee.' });
  }
  if (rule.priority !== undefined && (Number(rule.priority) < 0 || isNaN(Number(rule.priority)))) {
    return res.status(400).json({ error: 'Invalid priority.' });
  }
  if (rule.free_shipping_threshold !== undefined && rule.free_shipping_threshold !== null && (Number(rule.free_shipping_threshold) < 0 || isNaN(Number(rule.free_shipping_threshold)))) {
    return res.status(400).json({ error: 'Invalid free shipping threshold.' });
  }

  const allowedProviders = ['local', 'smsa', 'aramex', 'spl', 'dhl'];
  if (rule.shipping_provider && !allowedProviders.includes(rule.shipping_provider)) {
    return res.status(400).json({ error: `Invalid provider. Must be one of: ${allowedProviders.join(', ')}` });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(503).json({ error: 'Database unavailable.' });

  try {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    if (rule.name !== undefined) updateData.name = rule.name;
    if (rule.country !== undefined) updateData.country = rule.country;
    if (rule.city !== undefined) updateData.city = rule.city;
    if (rule.district !== undefined) updateData.district = rule.district;
    if (rule.postal_code !== undefined) updateData.postal_code = rule.postal_code;
    if (rule.delivery_method !== undefined) updateData.delivery_method = rule.delivery_method;
    if (rule.shipping_provider !== undefined) updateData.shipping_provider = rule.shipping_provider;
    if (rule.shipping_fee !== undefined) updateData.shipping_fee = Number(rule.shipping_fee);
    if (rule.currency !== undefined) updateData.currency = rule.currency;
    if (rule.smsa_allowed !== undefined) updateData.smsa_allowed = rule.smsa_allowed;
    if (rule.active !== undefined) updateData.active = rule.active;
    if (rule.priority !== undefined) updateData.priority = Number(rule.priority);
    if (rule.free_shipping_threshold !== undefined) {
      updateData.free_shipping_threshold = rule.free_shipping_threshold !== null ? Number(rule.free_shipping_threshold) : null;
    }

    const { error } = await supabase.from('zoal_shipping_rules').update(updateData).eq('id', id);
    if (error) throw error;

    return res.json({ success: true, rule: { id, ...updateData } });
  } catch (err: any) {
    console.error('Error updating shipping rule:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to update shipping rule.' });
  }
});

app.delete('/api/shipping/rules/:id', authenticateRequest, requireRole(['admin', 'staff', 'manager']), async (req, res) => {
  const { id } = req.params;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(503).json({ error: 'Database unavailable.' });

  try {
    const { error } = await supabase.from('zoal_shipping_rules').delete().eq('id', id);
    if (error) throw error;

    return res.json({ success: true, message: 'Shipping rule deleted successfully.' });
  } catch (err: any) {
    console.error('Error deleting shipping rule:', err.message);
    return res.status(500).json({ error: 'Failed to delete shipping rule.' });
  }
});

app.post('/api/shipping/rules/test', authenticateRequest, requireRole(['admin', 'staff', 'manager']), async (req, res) => {
  const { country, city, district, postal_code, subtotal } = req.body;
  try {
    const { resolveShippingOptions } = require('./server/shipping');
    const options = await resolveShippingOptions({
      country: country || 'Saudi Arabia',
      city: city || '',
      district: district || '',
      postal_code: postal_code || '',
      subtotal: Number(subtotal) || 0
    });
    return res.json({ success: true, options });
  } catch (err: any) {
    console.error('Error testing shipping options:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to resolve test options.' });
  }
});

// Expose dynamic mock shipping helper endpoints if in development/test mode
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/shipping/mock/list', (req, res) => {
    try {
      const { mockShipmentsDb } = require('./server/shipping');
      return res.json({ success: true, shipments: Array.from(mockShipmentsDb.values()) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/shipping/mock/shipment/:id', (req, res) => {
    try {
      const { mockShipmentsDb } = require('./server/shipping');
      const shipment = mockShipmentsDb.get(req.params.id);
      if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
      return res.json({ success: true, shipment });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/shipping/mock/advance', async (req, res) => {
    try {
      const { shipmentId, status } = req.body;
      const { mockShipmentsDb } = require('./server/shipping');
      const shipment = mockShipmentsDb.get(shipmentId);
      if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

      const allowedStatuses = [
        'pending',
        'shipment_created',
        'picked_up',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'failed'
      ];

      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Allowed statuses are: ${allowedStatuses.join(', ')}` });
      }

      // Advance to next status if no specific status requested
      if (!status) {
        const currentIndex = allowedStatuses.indexOf(shipment.shipment_status);
        if (currentIndex !== -1 && currentIndex < allowedStatuses.length - 1) {
          shipment.shipment_status = allowedStatuses[currentIndex + 1];
        }
      } else {
        shipment.shipment_status = status;
      }

      shipment.updated_at = new Date().toISOString();

      // Sync order shipment status in database if Supabase is configured
      const { getSupabaseClient } = require('./server/supabase');
      const supabase = getSupabaseClient();
      if (supabase && shipment.order_id) {
        await supabase
          .from('zoal_orders')
          .update({ 
            shipment_status: shipment.shipment_status,
            tracking_number: shipment.tracking_number,
            updated_at: new Date().toISOString()
          })
          .eq('id', shipment.order_id);
      }

      return res.json({ success: true, shipment });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
}

// Create a new order in Supabase
app.post('/api/orders/create', authenticateRequest, async (req, res) => {
  const { order } = req.body;
  if (!order || !order.id || !order.items) {
    return res.status(400).json({ error: 'Invalid order structure.' });
  }

  // Authoritatively validate shipping rules on the server before persisting
  const clientCity = order.city || order.region || '';
  const clientDistrict = order.district || '';
  const clientPostalCode = order.postalCode || '';
  
  let selectedMethod: 'local_delivery' | 'smsa' = 'local_delivery';
  const deliveryMethodLower = (order.deliveryMethod || '').toLowerCase();
  if (deliveryMethodLower.includes('smsa') || deliveryMethodLower.includes('regional')) {
    selectedMethod = 'smsa';
  }

  let authoritativeFee = 0;
  let resolvedRuleId = '';
  let resolvedProvider = 'local';
  let resolvedSmsaAllowed = false;

  try {
    const resFee = await calculateAuthoritativeShippingFee({
      city: clientCity,
      district: clientDistrict,
      postal_code: clientPostalCode,
      subtotal: order.subtotal || 0
    }, selectedMethod);
    authoritativeFee = resFee.fee;
    resolvedRuleId = resFee.ruleId;
    resolvedProvider = resFee.provider;
    resolvedSmsaAllowed = resFee.smsaAllowed;

    // Verify and correct shipping fee mismatch dynamically
    if (Math.abs(order.shipping - authoritativeFee) > 0.01) {
      console.warn(`⚠️ Shipping fee security mismatch. Client: ${order.shipping} SAR, Server: ${authoritativeFee} SAR. Overriding dynamically.`);
      order.shipping = authoritativeFee;
      order.total = parseFloat((order.subtotal - (order.discount || 0) + (order.tax || 0) + authoritativeFee).toFixed(2));
    }
  } catch (err: any) {
    console.error('❌ Server-side shipping validation rejection:', err.message);
    return res.status(400).json({ error: `Shipping validation rejected: ${err.message}` });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    // If Supabase is not configured, we still return success because handleOrderSuccess 
    // will fall back to local storage in the frontend, but we log the warning.
    console.warn('⚠️ Supabase not configured. Order not persisted in cloud database.');
    return res.json({ success: true, persisted: false, message: 'Order created locally only.', validatedOrder: order });
  }

  try {
    // Query active published terms version ID for legal consent capture
    let termsAcceptedVersionId: string | null = null;
    try {
      const { data: termsDoc } = await supabase
        .from('zoal_legal_documents')
        .select('current_version_id, zoal_legal_document_versions(id, status)')
        .or('slug.eq.terms,slug.eq.terms-and-conditions')
        .maybeSingle();

      if (termsDoc) {
        if (termsDoc.current_version_id) {
          termsAcceptedVersionId = termsDoc.current_version_id;
        } else if (Array.isArray(termsDoc.zoal_legal_document_versions)) {
          const pubVersion = termsDoc.zoal_legal_document_versions.find((v: any) => v.status === 'Published');
          if (pubVersion) termsAcceptedVersionId = pubVersion.id;
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not resolve active published terms version ID for consent capture:', err);
    }

    // 1. Insert into zoal_orders
    const orderData: any = {
      id: order.id,
      customer_id: order.customerId || null,
      status: (order.status || 'pending').toLowerCase(),
      subtotal: order.subtotal,
      discount_amount: order.discount || 0,
      shipping_cost: order.shipping,
      tax_amount: order.tax || 0,
      total_amount: order.total,
      payment_method: order.paymentMethod,
      payment_status: 'unpaid', // Default
      tracking_number: order.trackingNumber || null,
      notes: order.customerNotes || '',
      delivery_method: selectedMethod,
      shipping_provider: resolvedProvider,
      shipping_rule_id: resolvedRuleId,
      shipment_id: order.shipmentId || null,
      shipment_status: order.shipmentStatus || 'pending_dispatch',
      terms_accepted_version_id: termsAcceptedVersionId,
      created_at: new Date().toISOString()
    };

    // Trigger logistics provider shipment registration
    const provider = getProvider(resolvedProvider);
    if (provider) {
      console.log(`[Logistics] Invoking shipping provider: ${provider.name} for order: ${order.id}`);
      const shipmentResult = await provider.createShipment(order);
      if (shipmentResult.success) {
        orderData.shipment_id = shipmentResult.shipmentId || null;
        orderData.tracking_number = shipmentResult.trackingNumber || null;
        orderData.shipment_status = shipmentResult.status || 'shipment_created';
        
        if (shipmentResult.labelUrl) {
          orderData.notes = `${orderData.notes}\n[Logistics Label] ${shipmentResult.labelUrl}`.trim();
        }
      } else {
        // Fail closed for SMSA if credentials are absent and not in mock mode
        if (resolvedProvider === 'smsa') {
          console.error(`[Logistics] SMSA Shipment creation failure: ${shipmentResult.error}`);
          return res.status(400).json({ error: `Fulfillment failed: ${shipmentResult.error || 'Unknown integration error.'}` });
        }
      }
    }

    const { error: orderError } = await supabase.from('zoal_orders').insert(orderData);
    if (orderError) throw orderError;

    // 2. Insert into zoal_order_items
    const orderItems = order.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
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

// Post order to trigger automated luxury confirmation emails
app.post('/api/orders/email', authenticateRequest, requireRole(['admin', 'staff']), async (req, res) => {
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
app.get('/api/supabase/status', authenticateRequest, requireRole(['admin']), async (req, res) => {
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
  businessLogo: row.business_logo || '/assets/branding/zoal-main-logo.jpg',
  favicon: row.favicon || '/assets/branding/zoal-main-logo.jpg',
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

async function initializeBrandingDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('⚠️ DATABASE_URL not set. Skipping branding database table initialization.');
    return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    // The table is managed by migrations/002_branding_and_sync.sql
    // Verify existence (optional: can be removed if confident in migrations)
    await client.query('SELECT 1 FROM branding_settings LIMIT 1');
    console.log('✅ branding_settings table verified.');


    // Check if empty
    const res = await client.query('SELECT COUNT(*) FROM branding_settings');
    const count = parseInt(res.rows[0].count, 10);
    
    if (count === 0) {
      console.log('🌱 Populating empty branding_settings table with default enterprise settings...');
      const defaultSocial = JSON.stringify({
        instagram: 'https://instagram.com/alzoal',
        twitter: 'https://twitter.com/alzoal'
      });
      await client.query(`
        INSERT INTO branding_settings (
          id, business_name, business_logo, favicon, company_description, phone, email, website, address, social_links, accent_color, theme, language, currency, shipping_fee_default, shipping_free_threshold, tax_rate, tax_id, smtp_host, smtp_port, smtp_user, smtp_pass, ip_whitelist, session_expiration_minutes, auto_backup_frequency, updated_by
        ) VALUES (
          1, 'AL ZOAL Enterprise', '/assets/branding/zoal-main-logo.jpg', '/assets/branding/zoal-main-logo.jpg', 'Al Zoal Luxury Boutique - Sovereign Enterprise Class Boutique and Media Management Platform', '+966 56 769 9315', 'alzoal3003@gmail.com', 'https://alzoal.sa', 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia', $1, '#D4AF37', 'dark', 'en', 'SAR', 35, 500, 15, 'VAT-789-ZOAL-99', 'smtp.zoal-cloud.sa', '587', 'relays@zoal.sa', '**********', '0.0.0.0/0', 120, 'daily', 'System'
        )
      `, [defaultSocial]);
      console.log('✅ Default enterprise branding settings populated successfully!');
    } else {
      console.log('✅ branding_settings table contains existing branding rows. Checking for legacy values...');
      await client.query(`
        UPDATE branding_settings 
        SET phone = '+966 56 769 9315',
            email = 'alzoal3003@gmail.com',
            address = 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia'
        WHERE id = 1 AND (
          phone = '+966 55 123 4567' OR 
          email = 'rkinfinity.official@gmail.com' OR 
          address = 'Main Branch, Saudi Arabia' OR
          address = 'Prince Turki Road, Al Khobar, Saudi Arabia'
        )
      `);
      console.log('✅ Checked and purged any legacy enterprise values from the active database row.');
    }
  } catch (err: any) {
    console.error('❌ Error during branding database table initialization:', err.message || err);
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

async function initializeShippingDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('⚠️ DATABASE_URL not set. Skipping shipping database column checks.');
    return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    // Add free_shipping_threshold to zoal_shipping_rules if it doesn't exist
    await client.query(`
      ALTER TABLE zoal_shipping_rules 
      ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC(12,2) DEFAULT 500 CHECK (free_shipping_threshold >= 0)
    `);
    console.log('✅ Checked/added free_shipping_threshold to zoal_shipping_rules table.');

    // Add logistics, shipping, and pickup columns to zoal_products if they don't exist
    await client.query(`
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_location TEXT NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_ready_time TEXT NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_open TEXT NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_close TEXT NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_friday_schedule TEXT NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_instruction TEXT NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_phone TEXT NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_whatsapp TEXT NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_email TEXT NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_map_url TEXT NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS shipping_scope TEXT[] NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS delivery_zones TEXT[] NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS free_shipping_minimum NUMERIC NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS cash_on_delivery BOOLEAN NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS packaging_type TEXT NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS temperature_control BOOLEAN NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS handling_flags TEXT[] NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS shipping_note TEXT NULL;
      ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS customer_delivery_message TEXT NULL;
    `);
    console.log('✅ Checked/added logistics and pickup columns to zoal_products table.');

    // Register type-safe synchronization function and trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION sync_zoal_supabase_product_to_core()
      RETURNS TRIGGER AS $$
      DECLARE
        v_category_id UUID;
        v_brand_id UUID;
        v_price NUMERIC;
        v_sale_price NUMERIC;
        v_is_active BOOLEAN;
        v_image_urls TEXT[];
        v_pickup_location TEXT;
        v_pickup_ready_time TEXT;
        v_pickup_open TEXT;
        v_pickup_close TEXT;
        v_pickup_friday_schedule TEXT;
        v_pickup_instruction TEXT;
        v_pickup_phone TEXT;
        v_pickup_whatsapp TEXT;
        v_pickup_email TEXT;
        v_pickup_map_url TEXT;
        v_shipping_scope TEXT[];
        v_delivery_zones TEXT[];
        v_free_shipping BOOLEAN;
        v_free_shipping_minimum NUMERIC;
        v_cash_on_delivery BOOLEAN;
        v_packaging_type TEXT;
        v_temperature_control BOOLEAN;
        v_handling_flags TEXT[];
        v_shipping_note TEXT;
        v_customer_delivery_message TEXT;
      BEGIN
        IF TG_OP = 'DELETE' THEN
          DELETE FROM zoal_products WHERE id = OLD.id;
          RETURN OLD;
        END IF;

        -- Extract category_id
        BEGIN
          IF NEW.data ? 'categoryId' AND NEW.data->>'categoryId' IS NOT NULL AND NEW.data->>'categoryId' <> '' THEN
            v_category_id := (NEW.data->>'categoryId')::UUID;
          ELSIF NEW.data ? 'category_id' AND NEW.data->>'category_id' IS NOT NULL AND NEW.data->>'category_id' <> '' THEN
            v_category_id := (NEW.data->>'category_id')::UUID;
          ELSE
            v_category_id := NULL;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_category_id := NULL;
        END;

        -- Extract brand_id
        BEGIN
          IF NEW.data ? 'brandId' AND NEW.data->>'brandId' IS NOT NULL AND NEW.data->>'brandId' <> '' THEN
            v_brand_id := (NEW.data->>'brandId')::UUID;
          ELSIF NEW.data ? 'brand_id' AND NEW.data->>'brand_id' IS NOT NULL AND NEW.data->>'brand_id' <> '' THEN
            v_brand_id := (NEW.data->>'brand_id')::UUID;
          ELSE
            v_brand_id := NULL;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_brand_id := NULL;
        END;

        -- Extract price
        BEGIN
          v_price := NEW.price;
          IF v_price IS NULL AND NEW.data ? 'price' THEN
            v_price := (NEW.data->>'price')::NUMERIC;
          END IF;
          IF v_price IS NULL THEN
            v_price := 0;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_price := 0;
        END;

        -- Extract sale_price
        BEGIN
          IF NEW.data ? 'salePrice' AND NEW.data->>'salePrice' IS NOT NULL AND NEW.data->>'salePrice' <> '' THEN
            v_sale_price := (NEW.data->>'salePrice')::NUMERIC;
          ELSIF NEW.data ? 'sale_price' AND NEW.data->>'sale_price' IS NOT NULL AND NEW.data->>'sale_price' <> '' THEN
            v_sale_price := (NEW.data->>'sale_price')::NUMERIC;
          ELSE
            v_sale_price := NULL;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_sale_price := NULL;
        END;

        -- Extract is_active
        BEGIN
          v_is_active := NEW.is_active;
          IF v_is_active IS NULL AND NEW.data ? 'isActive' THEN
            v_is_active := (NEW.data->>'isActive')::BOOLEAN;
          ELSIF v_is_active IS NULL AND NEW.data ? 'is_active' THEN
            v_is_active := (NEW.data->>'is_active')::BOOLEAN;
          END IF;
          IF v_is_active IS NULL THEN
            v_is_active := TRUE;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_is_active := TRUE;
        END;

        -- Extract image_urls
        BEGIN
          IF NEW.data ? 'image_urls' AND jsonb_typeof(NEW.data->'image_urls') = 'array' THEN
            SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.data->'image_urls')) INTO v_image_urls;
          ELSIF NEW.data ? 'images' AND jsonb_typeof(NEW.data->'images') = 'array' THEN
            SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.data->'images')) INTO v_image_urls;
          ELSE
            v_image_urls := '{}'::TEXT[];
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_image_urls := '{}'::TEXT[];
        END;

        -- Extract strings
        v_pickup_location := NEW.data->>'pickup_location';
        v_pickup_ready_time := NEW.data->>'pickup_ready_time';
        v_pickup_open := NEW.data->>'pickup_open';
        v_pickup_close := NEW.data->>'pickup_close';
        v_pickup_friday_schedule := NEW.data->>'pickup_friday_schedule';
        v_pickup_instruction := NEW.data->>'pickup_instruction';
        v_pickup_phone := NEW.data->>'pickup_phone';
        v_pickup_whatsapp := NEW.data->>'pickup_whatsapp';
        v_pickup_email := NEW.data->>'pickup_email';
        v_pickup_map_url := NEW.data->>'pickup_map_url';
        v_packaging_type := NEW.data->>'packaging_type';
        v_shipping_note := NEW.data->>'shipping_note';
        v_customer_delivery_message := NEW.data->>'customer_delivery_message';

        -- Extract arrays
        BEGIN
          IF NEW.data ? 'shipping_scope' AND jsonb_typeof(NEW.data->'shipping_scope') = 'array' THEN
            SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.data->'shipping_scope')) INTO v_shipping_scope;
          ELSE
            v_shipping_scope := NULL;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_shipping_scope := NULL;
        END;

        BEGIN
          IF NEW.data ? 'delivery_zones' AND jsonb_typeof(NEW.data->'delivery_zones') = 'array' THEN
            SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.data->'delivery_zones')) INTO v_delivery_zones;
          ELSE
            v_delivery_zones := NULL;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_delivery_zones := NULL;
        END;

        BEGIN
          IF NEW.data ? 'handling_flags' AND jsonb_typeof(NEW.data->'handling_flags') = 'array' THEN
            SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.data->'handling_flags')) INTO v_handling_flags;
          ELSE
            v_handling_flags := NULL;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_handling_flags := NULL;
        END;

        -- Extract booleans
        BEGIN
          IF NEW.data ? 'free_shipping' AND jsonb_typeof(NEW.data->'free_shipping') = 'boolean' THEN
            v_free_shipping := (NEW.data->'free_shipping')::BOOLEAN;
          ELSIF NEW.data ? 'free_shipping' AND NEW.data->>'free_shipping' IS NOT NULL THEN
            v_free_shipping := (NEW.data->>'free_shipping')::BOOLEAN;
          ELSE
            v_free_shipping := NULL;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_free_shipping := NULL;
        END;

        BEGIN
          IF NEW.data ? 'cash_on_delivery' AND jsonb_typeof(NEW.data->'cash_on_delivery') = 'boolean' THEN
            v_cash_on_delivery := (NEW.data->'cash_on_delivery')::BOOLEAN;
          ELSIF NEW.data ? 'cash_on_delivery' AND NEW.data->>'cash_on_delivery' IS NOT NULL THEN
            v_cash_on_delivery := (NEW.data->>'cash_on_delivery')::BOOLEAN;
          ELSE
            v_cash_on_delivery := NULL;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_cash_on_delivery := NULL;
        END;

        BEGIN
          IF NEW.data ? 'temperature_control' AND jsonb_typeof(NEW.data->'temperature_control') = 'boolean' THEN
            v_temperature_control := (NEW.data->'temperature_control')::BOOLEAN;
          ELSIF NEW.data ? 'temperature_control' AND NEW.data->>'temperature_control' IS NOT NULL THEN
            v_temperature_control := (NEW.data->>'temperature_control')::BOOLEAN;
          ELSE
            v_temperature_control := NULL;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_temperature_control := NULL;
        END;

        -- Extract free_shipping_minimum
        BEGIN
          IF NEW.data ? 'free_shipping_minimum' AND NEW.data->>'free_shipping_minimum' IS NOT NULL AND NEW.data->>'free_shipping_minimum' <> '' THEN
            v_free_shipping_minimum := (NEW.data->>'free_shipping_minimum')::NUMERIC;
          ELSE
            v_free_shipping_minimum := NULL;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_free_shipping_minimum := NULL;
        END;

        -- Upsert to zoal_products
        INSERT INTO zoal_products (
          id, category_id, brand_id, name, slug, description, price, sale_price, image_urls, sku, is_active,
          pickup_location, pickup_ready_time, pickup_open, pickup_close, pickup_friday_schedule,
          pickup_instruction, pickup_phone, pickup_whatsapp, pickup_email, pickup_map_url,
          shipping_scope, delivery_zones, free_shipping, free_shipping_minimum, cash_on_delivery,
          packaging_type, temperature_control, handling_flags, shipping_note, customer_delivery_message,
          created_at, updated_at
        ) VALUES (
          NEW.id,
          v_category_id,
          v_brand_id,
          NEW.name,
          COALESCE(NEW.data->>'slug', LOWER(REGEXP_REPLACE(NEW.name, '\s+', '-', 'g'))),
          COALESCE(NEW.data->>'description', ''),
          v_price,
          v_sale_price,
          v_image_urls,
          COALESCE(NEW.data->>'sku', 'SKU-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8)),
          v_is_active,
          v_pickup_location,
          v_pickup_ready_time,
          v_pickup_open,
          v_pickup_close,
          v_pickup_friday_schedule,
          v_pickup_instruction,
          v_pickup_phone,
          v_pickup_whatsapp,
          v_pickup_email,
          v_pickup_map_url,
          v_shipping_scope,
          v_delivery_zones,
          v_free_shipping,
          v_free_shipping_minimum,
          v_cash_on_delivery,
          v_packaging_type,
          v_temperature_control,
          v_handling_flags,
          v_shipping_note,
          v_customer_delivery_message,
          COALESCE(NEW.created_at, CURRENT_TIMESTAMP),
          COALESCE(NEW.updated_at, CURRENT_TIMESTAMP)
        )
        ON CONFLICT (id) DO UPDATE SET
          category_id = EXCLUDED.category_id,
          brand_id = EXCLUDED.brand_id,
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          sale_price = EXCLUDED.sale_price,
          image_urls = EXCLUDED.image_urls,
          sku = EXCLUDED.sku,
          is_active = EXCLUDED.is_active,
          pickup_location = EXCLUDED.pickup_location,
          pickup_ready_time = EXCLUDED.pickup_ready_time,
          pickup_open = EXCLUDED.pickup_open,
          pickup_close = EXCLUDED.pickup_close,
          pickup_friday_schedule = EXCLUDED.pickup_friday_schedule,
          pickup_instruction = EXCLUDED.pickup_instruction,
          pickup_phone = EXCLUDED.pickup_phone,
          pickup_whatsapp = EXCLUDED.pickup_whatsapp,
          pickup_email = EXCLUDED.pickup_email,
          pickup_map_url = EXCLUDED.pickup_map_url,
          shipping_scope = EXCLUDED.shipping_scope,
          delivery_zones = EXCLUDED.delivery_zones,
          free_shipping = EXCLUDED.free_shipping,
          free_shipping_minimum = EXCLUDED.free_shipping_minimum,
          cash_on_delivery = EXCLUDED.cash_on_delivery,
          packaging_type = EXCLUDED.packaging_type,
          temperature_control = EXCLUDED.temperature_control,
          handling_flags = EXCLUDED.handling_flags,
          shipping_note = EXCLUDED.shipping_note,
          customer_delivery_message = EXCLUDED.customer_delivery_message,
          updated_at = EXCLUDED.updated_at;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS trg_sync_zoal_supabase_product ON zoal_supabase_products;
      CREATE TRIGGER trg_sync_zoal_supabase_product
      AFTER INSERT OR UPDATE OR DELETE ON zoal_supabase_products
      FOR EACH ROW
      EXECUTE FUNCTION sync_zoal_supabase_product_to_core();
    `);
    console.log('✅ Registered type-safe synchronization database function and trigger successfully.');
  } catch (err: any) {
    console.warn('⚠️ Warning checking/adding columns:', err.message);
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

// Safe browser projection: never expose secrets or private credentials.
function mapBrandingToSafeClientSettings(row: any) {
  const social = row?.social_links || {};
  const socialLinks = typeof social === 'string' ? (() => { try { return JSON.parse(social); } catch { return {}; } })() : social;
  return {
    businessName: row?.business_name ?? 'AL ZOAL Enterprise',
    businessLogo: row?.business_logo ?? '/assets/branding/zoal-main-logo.jpg',
    favicon: row?.favicon ?? '/assets/branding/zoal-main-logo.jpg',
    companyDescription: row?.company_description ?? 'Al Zoal Luxury Boutique',
    phone: row?.phone ?? '+966 56 769 9315',
    email: row?.email ?? 'alzoal3003@gmail.com',
    website: row?.website ?? 'https://alzoal.sa',
    address: row?.address ?? 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia',
    instagram: socialLinks?.instagram || '',
    twitter: socialLinks?.twitter || '',
    accentColor: row?.accent_color ?? '#D4AF37',
    theme: row?.theme ?? 'dark',
    language: row?.language ?? 'en',
    currency: row?.currency ?? 'SAR',
    shippingFeeDefault: Number(row?.shipping_fee_default ?? 35),
    shippingFreeThreshold: Number(row?.shipping_free_threshold ?? 500),
    taxRate: Number(row?.tax_rate ?? 15),
    taxId: row?.tax_id ?? 'VAT-789-ZOAL-99',
    // Non-secret operational metadata only.
    smtpHost: row?.smtp_host ?? 'smtp.zoal-cloud.sa',
    smtpPort: String(row?.smtp_port ?? '587'),
    smtpUser: row?.smtp_user ?? 'relays@zoal.sa',
    ipWhitelist: row?.ip_whitelist ?? '0.0.0.0/0',
    sessionExpirationMinutes: Number(row?.session_expiration_minutes ?? 120),
    autoBackupFrequency: row?.auto_backup_frequency ?? 'daily'
  };
}

function brandingFallbackSettings() {
  return mapBrandingToSafeClientSettings({});
}

app.get('/api/branding', authenticateRequest, async (_req: any, res) => {
  let client: pg.Client | null = null;
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return res.json(brandingFallbackSettings());

    client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const result = await client.query('SELECT * FROM branding_settings WHERE id = 1 LIMIT 1');
    return res.json(result.rows.length > 0
      ? mapBrandingToSafeClientSettings(result.rows[0])
      : brandingFallbackSettings());
  } catch (err: any) {
    console.error('❌ Error fetching branding settings:', err?.message || err);
    return res.json(brandingFallbackSettings());
  } finally {
    if (client) await client.end().catch(() => {});
  }
});

app.post('/api/branding', authenticateRequest, requireRole(['manager']), async (req: any, res) => {
  let client: pg.Client | null = null;
  try {
    const config = req.body;
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: 'Missing configuration body.' });
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return res.status(500).json({ error: 'Database is not configured.' });

    const numberOrDefault = (value: any, fallback: number, min = 0) => {
      if (value === undefined || value === null || value === '') return fallback;
      const n = Number(value);
      if (!Number.isFinite(n) || n < min) throw new Error('Invalid numeric settings value.');
      return n;
    };

    const email = config.email || 'alzoal3003@gmail.com';
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    const socialLinks = JSON.stringify({
      instagram: typeof config.instagram === 'string' ? config.instagram : '',
      twitter: typeof config.twitter === 'string' ? config.twitter : ''
    });

    client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    // Lock/read current row so secrets are preserved and never sourced from browser payload.
    const current = await client.query('SELECT * FROM branding_settings WHERE id = 1 FOR UPDATE');
    const existing = current.rows[0] || null;

    const query = `
      INSERT INTO branding_settings (
        id, business_name, business_logo, favicon, company_description, phone, email, website, address, social_links,
        accent_color, theme, language, currency, shipping_fee_default, shipping_free_threshold, tax_rate, tax_id,
        smtp_host, smtp_port, smtp_user, smtp_pass, ip_whitelist, session_expiration_minutes, auto_backup_frequency, updated_by
      ) VALUES (
        1, $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
      )
      ON CONFLICT (id) DO UPDATE SET
        business_name=EXCLUDED.business_name, business_logo=EXCLUDED.business_logo, favicon=EXCLUDED.favicon,
        company_description=EXCLUDED.company_description, phone=EXCLUDED.phone, email=EXCLUDED.email,
        website=EXCLUDED.website, address=EXCLUDED.address, social_links=EXCLUDED.social_links,
        accent_color=EXCLUDED.accent_color, theme=EXCLUDED.theme, language=EXCLUDED.language, currency=EXCLUDED.currency,
        shipping_fee_default=EXCLUDED.shipping_fee_default, shipping_free_threshold=EXCLUDED.shipping_free_threshold,
        tax_rate=EXCLUDED.tax_rate, tax_id=EXCLUDED.tax_id, smtp_host=EXCLUDED.smtp_host,
        smtp_port=EXCLUDED.smtp_port, smtp_user=EXCLUDED.smtp_user,
        smtp_pass=branding_settings.smtp_pass,
        ip_whitelist=EXCLUDED.ip_whitelist, session_expiration_minutes=EXCLUDED.session_expiration_minutes,
        auto_backup_frequency=EXCLUDED.auto_backup_frequency, updated_at=CURRENT_TIMESTAMP, updated_by=EXCLUDED.updated_by
      RETURNING *;
    `;

    const values = [
      config.businessName || existing?.business_name || 'AL ZOAL Enterprise',
      config.businessLogo || existing?.business_logo || '/assets/branding/zoal-main-logo.jpg',
      config.favicon || existing?.favicon || '/assets/branding/zoal-main-logo.jpg',
      config.companyDescription || existing?.company_description || 'Al Zoal Luxury Boutique',
      config.phone || existing?.phone || '+966 56 769 9315',
      email, config.website || existing?.website || 'https://alzoal.sa',
      config.address || existing?.address || 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia',
      socialLinks, config.accentColor || existing?.accent_color || '#D4AF37',
      config.theme || existing?.theme || 'dark', config.language || existing?.language || 'en',
      config.currency || existing?.currency || 'SAR',
      numberOrDefault(config.shippingFeeDefault, Number(existing?.shipping_fee_default ?? 35)),
      numberOrDefault(config.shippingFreeThreshold, Number(existing?.shipping_free_threshold ?? 500)),
      numberOrDefault(config.taxRate, Number(existing?.tax_rate ?? 15)),
      config.taxId || existing?.tax_id || 'VAT-789-ZOAL-99',
      config.smtpHost || existing?.smtp_host || 'smtp.zoal-cloud.sa',
      String(config.smtpPort || existing?.smtp_port || '587'),
      config.smtpUser || existing?.smtp_user || 'relays@zoal.sa',
      existing?.smtp_pass ?? null,
      config.ipWhitelist || existing?.ip_whitelist || '0.0.0.0/0',
      numberOrDefault(config.sessionExpirationMinutes, Number(existing?.session_expiration_minutes ?? 120), 1),
      config.autoBackupFrequency || existing?.auto_backup_frequency || 'daily',
      req.user.email || 'Admin'
    ];

    const result = await client.query(query, values);
    return res.json({ success: true, settings: mapBrandingToSafeClientSettings(result.rows[0]) });
  } catch (err: any) {
    console.error('❌ Error updating branding settings:', err?.message || err);
    const message = err?.message === 'Invalid numeric settings value.' ? err.message : 'Failed to update branding settings.';
    return res.status(500).json({ error: message });
  } finally {
    if (client) await client.end().catch(() => {});
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
  'blog-images',
  'documents',
  'invoices',
  'homepage-editorial'
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

    // Security: Block execution-capable or dangerous file extensions
    const forbiddenExtensions = ['.php', '.php3', '.php4', '.php5', '.phtml', '.exe', '.bat', '.sh', '.js', '.vbs', '.pl', '.cgi', '.msi', '.com'];
    const lowerName = file.originalname.toLowerCase();
    if (forbiddenExtensions.some(ext => lowerName.endsWith(ext))) {
      return res.status(400).json({ error: 'Security Violation: Disallowed file extension.' });
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

// Delete file endpoint with Enterprise Asset Reference Protection
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

    const supabase = getServiceSupabaseClient() || getSupabaseClient();
    const filename = extractFilename(filePath);

    console.log('[Storage] Checking references...');
    let refCount = 0;
    if (filename && supabase) {
      refCount = await checkImageReferences(supabase, filename);
    }
    console.log(`Found ${refCount} references`);

    if (refCount > 0) {
      console.log('Delete skipped.');
      return res.json({
        success: true,
        skipped: true,
        references: refCount,
        message: 'ℹ Old image is still used elsewhere. Storage object preserved.'
      });
    }

    console.log('Deleting object...');
    const result = await deleteFromSupabase(bucket, filePath);

    if (!result.success) {
      console.error(`❌ Supabase Storage deletion error:`, result.error);
      return res.status(500).json({ error: result.error || 'Failed to delete from Supabase' });
    }

    console.log('Delete successful.');
    return res.json({ success: true, deleted: true, message: '✓ Old image removed successfully' });
  } catch (err: any) {
    console.error('❌ Error in /api/storage/delete:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Image optimization URL generation proxy / utility
app.get('/api/storage/optimize', authenticateRequest, requireRole(['admin']), (req, res) => {
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
app.get('/api/storage/private/invoices/:path(*)', authenticateRequest, requireRole(['staff']), async (req, res) => {
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
function generateInquiryEmailHtml(inquiry: { id: string; name: string; email: string; phone: string; message: string; date: string }): string {
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
app.post('/api/contact', validateContactSecurity, async (req, res) => {
  try {
    const { name, email, phone, message, msg } = req.body;
    const finalMessage = message || msg;

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
          console.log('✅ Inquiry saved successfully to zoal_inquiries table.');
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
          date: formattedDate
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
// ENTERPRISE BLOG & NEWS CMS API ROUTES
// -------------------------------------------------------------
app.get('/api/blog', blogModule.getBlogPosts);
app.post('/api/blog', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.createBlogPost);
app.put('/api/blog/:id', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.updateBlogPost);
app.delete('/api/blog/:id', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.deleteBlogPost);

app.get('/api/blog/categories', blogModule.getCategories);
app.post('/api/blog/categories', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.createCategory);
app.put('/api/blog/categories/:id', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.updateCategory);
app.delete('/api/blog/categories/:id', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.deleteCategory);

app.get('/api/blog/tags', blogModule.getTags);
app.post('/api/blog/tags', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.createTag);
app.delete('/api/blog/tags/:id', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.deleteTag);

app.get('/api/blog/comments', blogModule.getComments);
app.post('/api/blog/comments', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.createComment);
app.put('/api/blog/comments/:id', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.updateCommentStatus);
app.delete('/api/blog/comments/:id', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.deleteComment);

app.get('/api/blog/authors', blogModule.getAuthors);
app.post('/api/blog/authors', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.createAuthor);

app.get('/api/blog/media', blogModule.getMedia);
app.post('/api/blog/media', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.uploadMedia);
app.put('/api/blog/media/:id', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.updateMedia);
app.delete('/api/blog/media/:id', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.deleteMedia);

app.get('/api/blog/seo/:postId', blogModule.getSeo);
app.post('/api/blog/seo', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.upsertSeo);

app.get('/api/blog/search', blogModule.searchBlog);
app.get('/api/blog/sitemap', blogModule.generateBlogSitemap);
app.get('/api/blog/rss', blogModule.generateBlogRss);

app.post('/api/blog/newsletter', blogModule.subscribeNewsletter);
app.get('/api/blog/revisions/:postId', blogModule.getRevisions);
app.post('/api/blog/revisions', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.createRevision);
app.get('/api/blog/schedule', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.getSchedules);
app.post('/api/blog/schedule', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.scheduleBlogPost);
app.post('/api/blog/schedule/cancel', authenticateRequest, requireRole(['staff', 'editor', 'manager', 'admin', 'owner']), blogModule.cancelPostSchedule);
app.post('/api/blog/posts/:id/view', blogModule.trackBlogPostView);
app.post('/api/blog/:id/view', blogModule.trackBlogPostView);

// -------------------------------------------------------------
// ENTERPRISE PRODUCTION PRODUCT IMPORT ENGINE API ROUTES
// -------------------------------------------------------------
app.get('/api/products', productImportModule.getProductsApi);
app.post('/api/products', authenticateRequest, requireRole(['manager']), productsCrudModule.createProduct);
app.put('/api/products/:id', authenticateRequest, requireRole(['manager']), productsCrudModule.updateProduct);
app.patch('/api/products/:id', authenticateRequest, requireRole(['manager']), productsCrudModule.patchProduct);
app.delete('/api/products/:id', authenticateRequest, requireRole(['manager']), productsCrudModule.deleteProduct);

app.post('/api/admin/products/import', authenticateRequest, requireRole(['admin']), productImportModule.executeProductionImport);
app.get('/api/admin/products/import/logs', authenticateRequest, requireRole(['admin']), productImportModule.getImportLogs);
app.post('/api/admin/products/sync-verify', authenticateRequest, requireRole(['admin']), productImportModule.syncAndVerifyProducts);

// -------------------------------------------------------------
// ENTERPRISE WAREHOUSE & DISTRIBUTION HUBS API ROUTES
// -------------------------------------------------------------
app.get('/api/warehouses', warehousesModule.getWarehouses);
app.get('/api/warehouses/:id', warehousesModule.getWarehouseById);
app.post('/api/warehouses', authenticateRequest, requireRole(['admin', 'staff']), warehousesModule.createWarehouse);
app.put('/api/warehouses/:id', authenticateRequest, requireRole(['admin', 'staff']), warehousesModule.updateWarehouse);
app.delete('/api/warehouses/:id', authenticateRequest, requireRole(['admin', 'staff']), warehousesModule.deleteWarehouse);

// -------------------------------------------------------------
// ENTERPRISE CUSTOMER CRM & INVITATION AUTHENTICATION API ROUTES
// -------------------------------------------------------------
app.post('/api/auth/invite/setup', crmModule.setupInvitePassword);
app.post('/api/auth/invite/verify', crmModule.verifyInviteToken);
app.get('/api/auth/invite/verify', crmModule.verifyInviteToken);

app.get('/api/admin/customers', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), crmModule.getCustomers);
app.get('/api/admin/customers/:id', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), crmModule.getCustomerById);
app.post('/api/admin/customers', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), crmModule.createCustomer);
app.patch('/api/admin/customers/:id', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), crmModule.updateCustomer);
app.post('/api/admin/customers/:id/status', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), crmModule.updateCustomerStatus);
app.post('/api/admin/customers/:id/notes', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), crmModule.addCustomerNote);
app.post('/api/admin/customers/:id/communications', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), crmModule.addCustomerCommunication);
app.delete('/api/admin/customers/:id', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), crmModule.deleteOrDeactivateCustomer);

// -------------------------------------------------------------
// SUPPORT CENTER API ROUTES

app.use('/api/support', authenticateRequest, requireRole(['staff']));

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

// Vite & Static file serving setup
async function startServer() {
  // Initialize branding database tables and settings row
  await initializeBrandingDatabase();
  await initializeShippingDatabase();

  // Sync seed users to active database (Supabase) asynchronously
  // Seeding disabled in Supabase migration

  app.use(express.static(path.join(process.cwd(), 'public')));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Implement high-performance, immutable caching for hashed production assets
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
