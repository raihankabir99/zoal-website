-- =========================================================================
--             AL ZOAL LUXURY BOUTIQUE - SEED DATA (DEVELOPMENT ONLY)
-- =========================================================================
-- Version: 004
-- Description: Populate default enterprise branding settings.

INSERT INTO branding_settings (
  id, business_name, business_logo, favicon, company_description, phone, email, website, address, social_links, accent_color, theme, language, currency, shipping_fee_default, shipping_free_threshold, tax_rate, tax_id, smtp_host, smtp_port, smtp_user, smtp_pass, ip_whitelist, session_expiration_minutes, auto_backup_frequency, updated_by
) VALUES (
  1, 
  'AL ZOAL Enterprise', 
  '/images/branding/zoal-logo.jpg', 
  '/assets/images/favicon.svg', 
  'Al Zoal Luxury Boutique - Sovereign Enterprise Class Boutique and Media Management Platform', 
  '+966 56 769 9315', 
  'alzoal3003@gmail.com', 
  'https://alzoal.sa', 
  'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia', 
  '{"instagram": "https://instagram.com/alzoal", "twitter": "https://twitter.com/alzoal"}'::jsonb, 
  '#D4AF37', 
  'dark', 
  'en', 
  'SAR', 
  35, 
  500, 
  15, 
  'VAT-789-ZOAL-99', 
  'smtp.zoal-cloud.sa', 
  '587', 
  'relays@zoal.sa', 
  '**********', 
  '0.0.0.0/0', 
  120, 
  'daily', 
  'System'
) ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  address = EXCLUDED.address;
