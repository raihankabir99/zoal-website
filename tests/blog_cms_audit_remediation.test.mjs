import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const blogServiceSource = fs.readFileSync(new URL('../src/services/blogService.ts', import.meta.url), 'utf8');
const serverBlogSource = fs.readFileSync(new URL('../server/blog.ts', import.meta.url), 'utf8');
const serverSource = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const blogArticleSource = fs.readFileSync(new URL('../src/components/blog/BlogArticle.tsx', import.meta.url), 'utf8');
const blogGridPageSource = fs.readFileSync(new URL('../src/components/blog/BlogGridPage.tsx', import.meta.url), 'utf8');
const blogSource = fs.readFileSync(new URL('../src/components/Blog.tsx', import.meta.url), 'utf8');

test('P0: Removal of Mock Fallback Data in blogService.ts', () => {
  // Ensure FALLBACK constants are not returned on API error/empty
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
