import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const blogServiceSource = fs.readFileSync(new URL('../src/services/blogService.ts', import.meta.url), 'utf8');
const serverBlogSource = fs.readFileSync(new URL('../server/blog.ts', import.meta.url), 'utf8');
const serverSource = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const blogArticleSource = fs.readFileSync(new URL('../src/components/blog/BlogArticle.tsx', import.meta.url), 'utf8');
const blogGridPageSource = fs.readFileSync(new URL('../src/components/blog/BlogGridPage.tsx', import.meta.url), 'utf8');
const blogSource = fs.readFileSync(new URL('../src/components/Blog.tsx', import.meta.url), 'utf8');
const dashboardRouteSource = fs.readFileSync(new URL('../src/app/api/admin/dashboard-analytics/route.ts', import.meta.url), 'utf8');
const legacyDashboardSource = fs.readFileSync(new URL('../api/admin/dashboard-analytics.ts', import.meta.url), 'utf8');

test('P0: Removal of Mock Fallback Data in blogService.ts', () => {
  assert.doesNotMatch(blogServiceSource, /return FALLBACK_BLOG_POSTS/);
  assert.doesNotMatch(blogServiceSource, /return FALLBACK_CATEGORIES/);
  assert.doesNotMatch(blogServiceSource, /return FALLBACK_TAGS/);
  assert.doesNotMatch(blogServiceSource, /return FALLBACK_AUTHORS/);
});

test('P0: Server-side Tag Filtering in server/blog.ts', () => {
  assert.match(serverBlogSource, /zoal_blog_post_tags/);
  assert.match(serverBlogSource, /matchingPostIds/);
});

test('P1: Server-side Author Filtering and Trending Sort in server/blog.ts', () => {
  assert.match(serverBlogSource, /author_id/);
  assert.match(serverBlogSource, /sortBy === 'trending'/);
});

test('P0/P1: Like Status and Toggle Persistence Endpoints', () => {
  assert.match(serverBlogSource, /export async function getPostLikeStatus/);
  assert.match(serverBlogSource, /export async function togglePostLike/);
  assert.match(serverSource, /app\.get\('\/api\/blog\/posts\/:id\/like', blogModule\.getPostLikeStatus\)/);
  assert.match(serverSource, /app\.post\('\/api\/blog\/posts\/:id\/like', blogModule\.togglePostLike\)/);
});

test('P1: Like and Local Bookmark Persistence in BlogArticle.tsx', () => {
  assert.match(blogArticleSource, /blogService\.getLikeStatus/);
  assert.match(blogArticleSource, /blogService\.toggleLike/);
  assert.match(blogArticleSource, /zoal_blog_bookmarks_v1/);
});

test('P1: Newsletter Subscription API Integration in Blog.tsx', () => {
  assert.match(blogServiceSource, /subscribeNewsletter/);
  assert.match(blogSource, /handleNewsletterSubmit/);
  assert.match(blogSource, /blogService\.subscribeNewsletter/);
});

test('P1: Author Page Server-Side Filtering in BlogGridPage.tsx', () => {
  assert.match(blogGridPageSource, /blogService\.getPosts\(\{\s*author:\s*id\s*\}\)/);
  assert.match(blogGridPageSource, /type:\s*'category'\s*\|\s*'tag'\s*\|\s*'author'\s*\|\s*'archive'\s*\|\s*'trending'/);
});

test('P1: Arabic & RTL Support in Blog.tsx', () => {
  assert.match(blogSource, /dir=\{i18n\.language === 'ar' \? 'rtl' : 'ltr'\}/);
});

test('P1: Article SEO Audit in server/seo.ts and SEO.tsx', () => {
  const seoServerSource = fs.readFileSync(new URL('../server/seo.ts', import.meta.url), 'utf8');
  const seoComponentSource = fs.readFileSync(new URL('../src/components/SEO.tsx', import.meta.url), 'utf8');
  assert.match(seoServerSource, /zoal_blog_posts/);
  assert.match(seoServerSource, /status.*published/);
  assert.match(seoComponentSource, /selectedPost\.canonical_url/);
  assert.match(seoComponentSource, /noindex, nofollow/);
});

test('P1: Comments Error & Empty State Handling in BlogComments.tsx', () => {
  const commentsSource = fs.readFileSync(new URL('../src/components/blog/BlogComments.tsx', import.meta.url), 'utf8');
  assert.match(commentsSource, /fetchError/);
  assert.match(commentsSource, /Retry/);
});

test('P1: Scheduled Publishing Cron Endpoint in server/blog.ts and server.ts', () => {
  assert.match(serverBlogSource, /handleCronProcessSchedules/);
  assert.match(serverSource, /app\.post\('\/api\/blog\/cron\/process-schedules', blogModule\.handleCronProcessSchedules\)/);
  assert.match(serverSource, /app\.get\('\/api\/blog\/cron\/process-schedules', blogModule\.handleCronProcessSchedules\)/);
});

test('P1: Notification Dispatcher replaces native alert in BlogArticle.tsx', () => {
  assert.doesNotMatch(blogArticleSource, /alert\(t\('blog\.copy_link_success'\)\)/);
  assert.match(blogArticleSource, /dispatchNotification/);
});

test('P0: Like writes use server identity and atomic RPC', () => {
  assert.match(serverBlogSource, /getServiceSupabaseClient\(\)/);
  assert.match(serverBlogSource, /function getLikeIdentifier/);
  assert.doesNotMatch(serverBlogSource, /req\.body\.userIdentifier/);
  assert.match(serverBlogSource, /toggle_blog_like/);
});

test('P0: Scheduled publishing cron endpoint requires CRON_SECRET', () => {
  assert.match(serverBlogSource, /process\.env\.CRON_SECRET/);
  assert.match(serverBlogSource, /status\(401\)/);
});

test('P1: Database Security Migration 062 includes SET search_path and security_invoker', () => {
  const mig062 = fs.readFileSync(new URL('../migrations/062_blog_cms_final_security_and_hardening.sql', import.meta.url), 'utf8');
  assert.match(mig062, /SET search_path = public, pg_temp/);
  assert.match(mig062, /WITH \(security_invoker = true\)/);
});

test('P0: Dashboard analytics normalize order statuses consistently across both endpoints', () => {
  assert.match(dashboardRouteSource, /function normalizeOrderStatus/);
  assert.match(legacyDashboardSource, /function normalizeOrderStatus/);
  assert.match(dashboardRouteSource, /statusCounts\.pending/);
  assert.match(legacyDashboardSource, /statusCounts\.pending/);
  assert.match(dashboardRouteSource, /statusCounts\.cancelled/);
  assert.match(legacyDashboardSource, /statusCounts\.cancelled/);
  assert.match(dashboardRouteSource, /statusCounts\.completed \|\| statusCounts\.delivered/);
  assert.match(legacyDashboardSource, /statusCounts\.completed \|\| statusCounts\.delivered/);
  assert.match(dashboardRouteSource, /const allRevenueOrders = \(allRevenueResult\.data \|\| \[\]\)\.filter\(\(order: any\) => normalizeOrderStatus\(order\.status\) !== 'cancelled'\)/);
  assert.match(legacyDashboardSource, /const allRevenueOrders = \(allRevenueResult\.data \|\| \[\]\)\.filter\(\(order: any\) => normalizeOrderStatus\(order\.status\) !== 'cancelled'\)/);
});

test('P0: Inventory RLS does not expose inventory rows to arbitrary clients', () => {
  const inventoryRls = fs.readFileSync(new URL('../migrations/064_inventory_rls_hardening.sql', import.meta.url), 'utf8');
  assert.doesNotMatch(inventoryRls, /zoal_inventory.*FOR SELECT USING \(true\)/s);
  assert.match(inventoryRls, /CREATE POLICY \"zoal_inventory_select_privileged\"/);
  assert.match(inventoryRls, /USING \(public\.is_privileged_role\(\)\)/);
  assert.match(inventoryRls, /CREATE POLICY \"zoal_inventory_manage_privileged\"/);
});

test('P0: Product CRUD does not overwrite authoritative inventory', () => {
  const productCrudSource = fs.readFileSync(new URL('../server/products_crud.ts', import.meta.url), 'utf8');
  const createSection = productCrudSource.slice(productCrudSource.indexOf('export async function createProduct'), productCrudSource.indexOf('export async function updateProduct'));
  const updateSection = productCrudSource.slice(productCrudSource.indexOf('export async function updateProduct'), productCrudSource.indexOf('export async function patchProduct'));
  assert.doesNotMatch(createSection, /from\(['\"]zoal_inventory['\"]\)/);
  assert.doesNotMatch(createSection, /quantity:\s*body\.inventory/);
  assert.doesNotMatch(updateSection, /from\(['\"]zoal_inventory['\"]\)/);
  assert.doesNotMatch(updateSection, /quantity:\s*body\.inventory/);
});


test('P0: Inventory RLS migration removes every pre-existing inventory policy', () => {
  const inventoryRls = fs.readFileSync(new URL('../migrations/064_inventory_rls_hardening.sql', import.meta.url), 'utf8');
  assert.match(inventoryRls, /FOR pol IN\s+SELECT policyname\s+FROM pg_policies/);
  assert.match(inventoryRls, /DROP POLICY IF EXISTS/);
  assert.match(inventoryRls, /CREATE POLICY "zoal_inventory_select_privileged"/);
});

test('P0: Payment finalization is delegated to atomic database transitions', () => {
  const paymentSource = fs.readFileSync(new URL('../api/payments.ts', import.meta.url), 'utf8');
  assert.match(paymentSource, /rpc\('finalize_order_payment'/);
  assert.match(paymentSource, /rpc\('fail_order_payment'/);
  assert.doesNotMatch(paymentSource, /from\('zoal_inventory'\)/);
});

test('P0: Payment transition RPCs are server-only', () => {
  const paymentMigration = fs.readFileSync(new URL('../migrations/065_payment_inventory_and_function_execute_hardening.sql', import.meta.url), 'utf8');
  assert.match(paymentMigration, /REVOKE ALL ON FUNCTION public\.finalize_order_payment/);
  assert.match(paymentMigration, /REVOKE ALL ON FUNCTION public\.fail_order_payment/);
  assert.match(paymentMigration, /GRANT EXECUTE ON FUNCTION public\.finalize_order_payment.*service_role/s);
  assert.match(paymentMigration, /GRANT EXECUTE ON FUNCTION public\.fail_order_payment.*service_role/s);
});


test('Order API rejects non-integer and out-of-range quantities', () => {
  const orderSource = fs.readFileSync(new URL('../src/app/api/orders/route.ts', import.meta.url), 'utf8');
  assert.match(orderSource, /Number\.isInteger\(qty\)/);
  assert.match(orderSource, /qty < 1/);
  assert.match(orderSource, /qty > 1000/);
});

test('Order API resolves tax from active tax configuration', () => {
  const orderSource = fs.readFileSync(new URL('../src/app/api/orders/route.ts', import.meta.url), 'utf8');
  assert.match(orderSource, /from\('zoal_tax_rates'\)/);
  assert.doesNotMatch(orderSource, /taxableAmount \* 0\.15/);
});

test('Staff order updates enforce explicit lifecycle transitions', () => {
  const staffSource = fs.readFileSync(new URL('../src/app/api/staff/route.ts', import.meta.url), 'utf8');
  assert.match(staffSource, /allowed: Record<string, string\[\]>/);
  assert.match(staffSource, /Invalid order status transition/);
});

test('Order expiry performs reservation release and order failure inside a transaction', () => {
  const appSource = fs.readFileSync(new URL('../app.ts', import.meta.url), 'utf8');
  assert.match(appSource, /await client\.query\('BEGIN'\)/);
  assert.match(appSource, /await client\.query\('COMMIT'\)/);
  assert.match(appSource, /await client\.query\('ROLLBACK'/);
});


test('Order creation uses a single atomic database transaction RPC', () => {
  const orderSource = fs.readFileSync(new URL('../src/app/api/orders/route.ts', import.meta.url), 'utf8');
  assert.match(orderSource, /rpc\('create_order_atomic'/);
  assert.doesNotMatch(orderSource, /from\('zoal_orders'\)\.insert/);
  assert.doesNotMatch(orderSource, /from\('zoal_order_items'\)\.insert/);
});

test('Atomic order RPC is server-only', () => {
  const migration = fs.readFileSync(new URL('../migrations/066_atomic_order_creation.sql', import.meta.url), 'utf8');
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.create_order_atomic/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.create_order_atomic/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.create_order_atomic.*service_role/s);
  assert.match(migration, /FOR UPDATE/);
});

test('P0: Atomic cancellation RPC releases ledger reservations and is server-only', () => {
  const migration = fs.readFileSync(new URL('../migrations/066_atomic_order_creation.sql', import.meta.url), 'utf8');
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.cancel_order_and_release_inventory/);
  assert.match(migration, /released_at IS NULL/);
  assert.match(migration, /SET reserved_quantity = GREATEST\(reserved_quantity - r\.quantity, 0\)/);
  assert.match(migration, /SET status = 'cancelled'/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.cancel_order_and_release_inventory/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.cancel_order_and_release_inventory.*service_role/s);
});


test('Order API delegates order creation to the atomic order creation RPC', () => {
  const orderSource = fs.readFileSync(new URL('../src/app/api/orders/route.ts', import.meta.url), 'utf8');
  assert.match(orderSource, /rpc\('create_order_atomic'/);
  assert.doesNotMatch(orderSource, /from\('zoal_orders'\)\.insert/);
  assert.doesNotMatch(orderSource, /from\('zoal_order_items'\)\.insert/);
});

test('Atomic order migration reserves stock and redeems coupons inside one transaction', () => {
  const migration = fs.readFileSync(new URL('../migrations/066_atomic_order_creation.sql', import.meta.url), 'utf8');
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.create_order_atomic/);
  assert.match(migration, /FOR UPDATE/);
  assert.match(migration, /reserved_quantity/);
  assert.match(migration, /redeem_coupon_for_order/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.create_order_atomic/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.create_order_atomic.*service_role/s);
});


test('P0: Cancellation and expiry use reservation ledger release instead of direct reserved_quantity writes', () => {
  const staffSource = fs.readFileSync(new URL('../src/app/api/staff/route.ts', import.meta.url), 'utf8');
  const appSource = fs.readFileSync(new URL('../app.ts', import.meta.url), 'utf8');
  assert.match(staffSource, /cancel_order_and_release_inventory/);
  assert.doesNotMatch(staffSource, /from\(['"]zoal_inventory['"]\)[\s\S]*reserved_quantity/);
  assert.match(appSource, /release_order_inventory/);
  assert.doesNotMatch(appSource, /UPDATE zoal_inventory[\s\S]*reserved_quantity = reserved_quantity -/);
});

test('P0: Staff order status handler uses the validated orderId variable', () => {
  const staffSource = fs.readFileSync(new URL('../src/app/api/staff/route.ts', import.meta.url), 'utf8');
  assert.match(staffSource, /const orderId = body\.orderId/);
  assert.doesNotMatch(staffSource, /eq\('id', orderId\)/);
});


test('P0: Legacy checkout has no direct reserved_quantity writes', () => {
  const appSource = fs.readFileSync(new URL('../app.ts', import.meta.url), 'utf8');
  assert.match(appSource, /reserve_order_inventory/);
  assert.doesNotMatch(appSource, /reserved_quantity\s*:/);
  assert.doesNotMatch(appSource, /\.from\(['"]zoal_inventory['"]\)[\s\S]*\.update\(/);
});

test('P0: Inventory reservation RPC is server-only and writes reservation ledger', () => {
  const migration = fs.readFileSync(new URL('../migrations/066_atomic_order_creation.sql', import.meta.url), 'utf8');
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.reserve_order_inventory/);
  assert.match(migration, /FOR UPDATE/);
  assert.match(migration, /INSERT INTO public\.zoal_order_inventory_reservations/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.reserve_order_inventory\(text,jsonb\).*service_role/s);
});


test('P0: Post-payment order persistence is idempotent and does not insert a duplicate order', () => {
  const appSource = fs.readFileSync(new URL('../app.ts', import.meta.url), 'utf8');
  const routeStart = appSource.indexOf("app.post('/api/orders/create'");
  const routeEnd = appSource.indexOf('// ==========================================', routeStart);
  const route = appSource.slice(routeStart, routeEnd);
  assert.match(route, /\.from\(['"]zoal_orders['"]\)[\s\S]*\.maybeSingle\(\)/);
  assert.match(route, /idempotent:\s*true/);
  assert.match(route, /You do not have permission to finalize this order/);
});
