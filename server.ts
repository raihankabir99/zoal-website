import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import * as AuthDB from './server/auth_db';
import { getSupabaseClient, isSupabaseConfigured, SUPABASE_SQL_SCHEMA } from './server/supabase';

// Resolve ESM vs CJS paths safely
const __filename_esm = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '';
const __dirname_esm = __filename_esm ? path.dirname(__filename_esm) : '';

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure the local database directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const EMAIL_DB_PATH = path.join(DATA_DIR, 'email_history.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(EMAIL_DB_PATH)) {
  fs.writeFileSync(EMAIL_DB_PATH, JSON.stringify([], null, 2));
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

// ENDPOINTS

// ==========================================
// AL ZOAL SOVEREIGN AUTHENTICATION SYSTEM API
// ==========================================

// Register a new customer
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword, acceptTerms } = req.body;

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!acceptTerms) {
      return res.status(400).json({ error: 'You must accept the Terms & Conditions.' });
    }

    // Password validation: minimum 8 chars, 1 uppercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const users = await AuthDB.readUsersAsync();

    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    if (users.some((u) => u.phone === phone)) {
      return res.status(400).json({ error: 'An account with this phone number already exists.' });
    }

    const verificationCode = String(100000 + Math.floor(Math.random() * 900000));
    const newUser: AuthDB.User = {
      id: `USR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      passwordHash: AuthDB.hashPassword(password),
      role: 'customer',
      isVerified: false,
      verificationCode,
      resetCode: '',
      createdAt: new Date().toISOString(),
      addresses: []
    };

    users.push(newUser);
    await AuthDB.writeUsersAsync(users);

    await AuthDB.logActivityAsync(newUser.id, newUser.email, 'REGISTER', req.ip || '', req.headers['user-agent'] || '');

    // Attempt to send email
    console.log(`[AUTH] User registered: ${newUser.email}. Verification Code: ${verificationCode}`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Verification code generated.',
      verificationCode,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        name: `${newUser.firstName} ${newUser.lastName}`,
        phone: newUser.phone,
        role: newUser.role,
        isVerified: newUser.isVerified,
        addresses: []
      }
    });
  } catch (error: any) {
    console.error('Error during registration API:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Verify email with code
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required.' });
    }

    const users = await AuthDB.readUsersAsync();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      return res.status(400).json({ error: 'Account not found.' });
    }

    const user = users[userIndex];
    if (user.isVerified) {
      return res.json({ success: true, message: 'Account is already verified.' });
    }

    if (user.verificationCode !== String(code).trim()) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    users[userIndex].isVerified = true;
    users[userIndex].verificationCode = 'VERIFIED';
    await AuthDB.writeUsersAsync(users);

    await AuthDB.logActivityAsync(user.id, user.email, 'VERIFY_EMAIL', req.ip || '', req.headers['user-agent'] || '');

    return res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error during verification.' });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { emailOrPhone, password, rememberMe } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: 'Email/Phone and Password are required.' });
    }

    const users = await AuthDB.readUsersAsync();
    const cleanCredential = emailOrPhone.trim().toLowerCase();

    const user = users.find(
      (u) =>
        u.email.toLowerCase() === cleanCredential ||
        u.phone === cleanCredential ||
        u.phone.replace(/\s+/g, '') === cleanCredential.replace(/\s+/g, '')
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isPasswordCorrect = AuthDB.verifyPassword(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Invalid credentials. Password incorrect.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Email is not verified.',
        needsVerification: true,
        email: user.email,
        verificationCode: user.verificationCode // Pass back so they can log in seamlessly in development
      });
    }

    // Generate Session
    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    const sessions = await AuthDB.readSessionsAsync();

    const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 1 day
    const expiresAt = new Date(Date.now() + duration).toISOString();

    sessions.push({
      token,
      userId: user.id,
      expiresAt,
      rememberMe: !!rememberMe
    });

    await AuthDB.writeSessionsAsync(sessions);
    await AuthDB.logActivityAsync(user.id, user.email, 'LOGIN', req.ip || '', req.headers['user-agent'] || '');

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Auto login / Session verification
app.post('/api/auth/session', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = req.body.token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({ error: 'No session token provided.' });
    }

    const sessions = await AuthDB.readSessionsAsync();
    const session = sessions.find((s) => s.token === token);

    if (!session) {
      return res.status(401).json({ error: 'Invalid session token.' });
    }

    if (new Date(session.expiresAt) < new Date()) {
      // Clean up expired session
      const updated = sessions.filter((s) => s.token !== token);
      await AuthDB.writeSessionsAsync(updated);
      return res.status(401).json({ error: 'Session has expired.' });
    }

    const users = await AuthDB.readUsersAsync();
    const user = users.find((u) => u.id === session.userId);

    if (!user) {
      return res.status(401).json({ error: 'Associated account not found.' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error during session retrieval.' });
  }
});

// Forgot Password - Send Reset Code
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) {
      return res.status(400).json({ error: 'Email or phone number is required.' });
    }

    const users = await AuthDB.readUsersAsync();
    const cleanCredential = emailOrPhone.trim().toLowerCase();

    const userIndex = users.findIndex(
      (u) =>
        u.email.toLowerCase() === cleanCredential ||
        u.phone === cleanCredential ||
        u.phone.replace(/\s+/g, '') === cleanCredential.replace(/\s+/g, '')
    );

    if (userIndex === -1) {
      return res.status(400).json({ error: 'No account found with this email or phone.' });
    }

    const user = users[userIndex];
    const resetCode = String(100000 + Math.floor(Math.random() * 900000));

    users[userIndex].resetCode = resetCode;
    await AuthDB.writeUsersAsync(users);

    await AuthDB.logActivityAsync(user.id, user.email, 'FORGOT_PASSWORD_REQUESTED', req.ip || '', req.headers['user-agent'] || '');

    console.log(`[AUTH] Password Reset requested for ${user.email}. Code: ${resetCode}`);

    return res.json({
      success: true,
      message: 'Reset code generated successfully.',
      resetCode // Return for testing
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error during password recovery.' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { emailOrPhone, resetCode, password, confirmPassword } = req.body;

    if (!emailOrPhone || !resetCode || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Password strength check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const users = await AuthDB.readUsersAsync();
    const cleanCredential = emailOrPhone.trim().toLowerCase();

    const userIndex = users.findIndex(
      (u) =>
        u.email.toLowerCase() === cleanCredential ||
        u.phone === cleanCredential ||
        u.phone.replace(/\s+/g, '') === cleanCredential.replace(/\s+/g, '')
    );

    if (userIndex === -1) {
      return res.status(400).json({ error: 'No account found.' });
    }

    const user = users[userIndex];
    if (!user.resetCode || user.resetCode !== String(resetCode).trim()) {
      return res.status(400).json({ error: 'Invalid or expired password reset code.' });
    }

    users[userIndex].passwordHash = AuthDB.hashPassword(password);
    users[userIndex].resetCode = '';
    users[userIndex].isVerified = true; // Auto-verify if they reset via code
    await AuthDB.writeUsersAsync(users);

    await AuthDB.logActivityAsync(user.id, user.email, 'PASSWORD_RESET', req.ip || '', req.headers['user-agent'] || '');

    return res.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error during password reset.' });
  }
});

// Change Password (Authenticated User)
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({ error: 'Session token required.' });
    }

    const sessions = await AuthDB.readSessionsAsync();
    const session = sessions.find((s) => s.token === token);

    if (!session) {
      return res.status(401).json({ error: 'Invalid session token.' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const users = await AuthDB.readUsersAsync();
    const userIndex = users.findIndex((u) => u.id === session.userId);

    if (userIndex === -1) {
      return res.status(400).json({ error: 'Associated user account not found.' });
    }

    const user = users[userIndex];
    const isPasswordCorrect = AuthDB.verifyPassword(currentPassword, user.passwordHash);

    if (!isPasswordCorrect) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.'
      });
    }

    users[userIndex].passwordHash = AuthDB.hashPassword(newPassword);
    await AuthDB.writeUsersAsync(users);

    await AuthDB.logActivityAsync(user.id, user.email, 'PASSWORD_CHANGED', req.ip || '', req.headers['user-agent'] || '');

    return res.json({
      success: true,
      message: 'Password updated successfully!'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error during password change.' });
  }
});

// Update Profile & Saved Addresses
app.post('/api/auth/update-profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({ error: 'Session token required.' });
    }

    const sessions = await AuthDB.readSessionsAsync();
    const session = sessions.find((s) => s.token === token);

    if (!session) {
      return res.status(401).json({ error: 'Invalid session token.' });
    }

    const { firstName, lastName, phone, addresses } = req.body;
    const users = await AuthDB.readUsersAsync();
    const userIndex = users.findIndex((u) => u.id === session.userId);

    if (userIndex === -1) {
      return res.status(400).json({ error: 'User not found.' });
    }

    const user = users[userIndex];

    if (firstName) users[userIndex].firstName = firstName.trim();
    if (lastName) users[userIndex].lastName = lastName.trim();
    if (phone) users[userIndex].phone = phone.trim();
    if (addresses) users[userIndex].addresses = addresses;

    await AuthDB.writeUsersAsync(users);
    await AuthDB.logActivityAsync(user.id, user.email, 'PROFILE_UPDATED', req.ip || '', req.headers['user-agent'] || '');

    const updatedUser = users[userIndex];

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        addresses: updatedUser.addresses || []
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error during profile update.' });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = req.body.token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(400).json({ error: 'Token is required for logout.' });
    }

    const sessions = await AuthDB.readSessionsAsync();
    const sessionIndex = sessions.findIndex((s) => s.token === token);

    if (sessionIndex !== -1) {
      const session = sessions[sessionIndex];
      const users = await AuthDB.readUsersAsync();
      const user = users.find((u) => u.id === session.userId);

      if (user) {
        await AuthDB.logActivityAsync(user.id, user.email, 'LOGOUT', req.ip || '', req.headers['user-agent'] || '');
      }

      sessions.splice(sessionIndex, 1);
      await AuthDB.writeSessionsAsync(sessions);
    }

    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error during logout.' });
  }
});

// Fetch Activity Logs (Admin only)
app.get('/api/auth/activity-logs', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided.' });
    }

    const token = authHeader.substring(7);
    const sessions = await AuthDB.readSessionsAsync();
    const session = sessions.find((s) => s.token === token);

    if (!session) {
      return res.status(401).json({ error: 'Invalid session token.' });
    }

    const users = await AuthDB.readUsersAsync();
    const user = users.find((u) => u.id === session.userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Administrative rights required.' });
    }

    const logs = await AuthDB.readLogsAsync();
    // Return sorted descending by timestamp
    const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json(sortedLogs);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error retrieving logs.' });
  }
});

// Get Email history logs
app.get('/api/orders/email-history', async (req, res) => {
  const logs = await readEmailDbAsync();
  res.json(logs);
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

// Sync local database JSON records into Supabase tables
app.post('/api/supabase/sync', async (req, res) => {
  try {
    const configured = isSupabaseConfigured();
    if (!configured) {
      return res.status(400).json({ error: 'Supabase credentials are not configured in environment variables. Please provide SUPABASE_URL and SUPABASE_ANON_KEY first.' });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Failed to initialize Supabase client.' });
    }

    const results = {
      users: 0,
      sessions: 0,
      activity_logs: 0,
      email_logs: 0
    };

    // 1. Sync Users
    const localUsers = AuthDB.readUsers();
    if (localUsers.length > 0) {
      const dbUsers = localUsers.map(AuthDB.toSupabaseUser);
      const { error } = await supabase.from('zoal_users').upsert(dbUsers);
      if (error) {
        return res.status(500).json({ error: `Failed to synchronize users: ${error.message}. Please make sure you executed the SQL Schema script.` });
      }
      results.users = localUsers.length;
    }

    // 2. Sync Sessions
    const localSessions = AuthDB.readSessions();
    if (localSessions.length > 0) {
      const dbSessions = localSessions.map(AuthDB.toSupabaseSession);
      const { error } = await supabase.from('zoal_sessions').upsert(dbSessions);
      if (error) {
        return res.status(500).json({ error: `Failed to synchronize sessions: ${error.message}` });
      }
      results.sessions = localSessions.length;
    }

    // 3. Sync Activity Logs
    const localLogs = AuthDB.readLogs();
    if (localLogs.length > 0) {
      const dbLogs = localLogs.map(AuthDB.toSupabaseLog);
      const { error } = await supabase.from('zoal_activity_logs').upsert(dbLogs);
      if (error) {
        return res.status(500).json({ error: `Failed to synchronize activity logs: ${error.message}` });
      }
      results.activity_logs = localLogs.length;
    }

    // 4. Sync Email Logs
    const localEmails = readEmailDb();
    if (localEmails.length > 0) {
      const dbEmails = localEmails.map(toSupabaseEmailLog);
      const { error } = await supabase.from('zoal_email_logs').upsert(dbEmails);
      if (error) {
        return res.status(500).json({ error: `Failed to synchronize email logs: ${error.message}` });
      }
      results.email_logs = localEmails.length;
    }

    // Log the sync action as a new activity log
    await AuthDB.logActivityAsync(
      'USR-ADMIN-1',
      'alzoal3003@gmail.com',
      'SUPABASE_DATA_SYNC',
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    return res.json({
      success: true,
      message: 'Successfully migrated all local JSON files to Supabase tables!',
      syncedCounts: results
    });
  } catch (err: any) {
    console.error('Error during Supabase synchronization:', err);
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
app.post('/api/contact', async (req, res) => {
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

// Vite & Static file serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
