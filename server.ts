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
import { getSupabaseClient, isSupabaseConfigured, SUPABASE_SQL_SCHEMA } from './server/supabase';
import pg from 'pg';
const { Client } = pg;

import {
  storageUploadMiddleware,
  storageMultipleUploadMiddleware,
  uploadToSupabase,
  deleteFromSupabase,
  getOptimizedImageUrl
} from './server/storage';

import { PRODUCTS } from './src/data';
import { friendlyToUUID } from './src/lib/uuidMapper';
import { injectServerSEO } from './server/seo';

import {
  securityHeadersMiddleware,
  rateLimiterMiddleware,
  csrfProtectionMiddleware,
  xssSanitizerMiddleware,
  authenticateRequest,
  requireRole,
  validateContactSecurity,
  serveRobotsTxt,
  serveSitemapXml
} from './server/security';

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
// DEPRECATED: Moved to server/security.ts
// async function authenticateRequest(req: any, res: any, next: any) { ... }

// Session validation & profile retrieval
app.post('/api/auth/session', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    let token = req.body.token;

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

    // Now let's fetch the user profile from zoal_users to get their role and details
    let { data: profile, error: profileError } = await supabase
      .from('zoal_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Auto-create/sync missing profile row in zoal_users
      const metadata = user.user_metadata || {};
      const firstName = metadata.first_name || metadata.firstName || metadata.full_name?.split(' ')[0] || 'User';
      const lastName = metadata.last_name || metadata.lastName || metadata.full_name?.split(' ').slice(1).join(' ') || '';
      const phone = metadata.phone || '';
      const newUser = {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        phone: phone,
        password_hash: '',
        role: 'customer',
        is_verified: user.email_confirmed_at ? true : false,
        addresses: []
      };

      await supabase.from('zoal_users').insert(newUser);
      
      profile = {
        id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        role: 'customer',
        is_verified: user.email_confirmed_at ? true : false,
        addresses: []
      };
    }

    return res.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        name: `${profile.first_name} ${profile.last_name}`,
        phone: profile.phone,
        role: profile.role,
        isVerified: profile.is_verified,
        addresses: profile.addresses || []
      }
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return res.status(500).json({ error: 'Internal server error during session retrieval.' });
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
app.get('/api/auth/activity-logs', authenticateRequest, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Administrative rights required.' });
    }

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

app.post('/api/branding', authenticateRequest, async (req: any, res) => {
  try {
    const user = req.user;
    if (!user || !['admin', 'manager', 'owner', 'enterprise_manager'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges to modify branding configuration.' });
    }

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
      user.email || 'Admin'
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

// Authentication middleware specifically for storage operations (upload, delete, list)
function authenticateStorageRequest(req: any, res: any, next: any) {
  authenticateRequest(req, res, () => {
    const user = req.user;
    if (!user || !['admin', 'manager', 'staff', 'owner', 'enterprise_manager'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges to access or manage assets.' });
    }
    next();
  });
}

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
app.post('/api/storage/upload', authenticateStorageRequest, storageUploadMiddleware, async (req, res) => {
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
app.get('/api/storage/list', authenticateStorageRequest, async (req, res) => {
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
app.post('/api/storage/delete', authenticateStorageRequest, async (req, res) => {
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
// SUPPORT CENTER API PROTECTION
// -------------------------------------------------------------

function authenticateSupportRequest(req: any, res: any, next: any) {
  authenticateRequest(req, res, () => {
    const user = req.user;
    if (!user || !['admin', 'manager', 'staff'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient Privileges' });
    }
    next();
  });
}

// -------------------------------------------------------------
// SUPPORT CENTER API ROUTES
// -------------------------------------------------------------

app.use('/api/support', authenticateSupportRequest);

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
