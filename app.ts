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

import { telemetry, telemetryMiddleware } from './backend/telemetry.ts';

import {
  getBlogPosts,
  getBlogPostById,
  getBlogPostPreview,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getCategories,
  getTags,
  getComments,
  createComment,
  updateCommentStatus,
  deleteComment,
  getAuthors,
  generateBlogSitemap,
  generateBlogRss,
  subscribeNewsletter,
  searchBlog,
  trackBlogPostView,
  scheduleBlogPost,
  cancelPostSchedule,
  getSchedules,
  getSeo,
  upsertSeo,
  getRevisions,
  createRevision,
  getMedia,
  uploadMedia,
  updateMedia,
  deleteMedia,
  createCategory,
  updateCategory,
  deleteCategory
} from './server/blog.ts';

import * as cmsModule from './server/cms.ts';
import * as textsModule from './server/texts.ts';
import * as marketingModule from './server/marketing.ts';
import * as legalModule from './server/legal.ts';
import * as taxModule from './server/taxes.ts';
import * as aiModule from './server/ai.ts';
import * as aiTranslationsModule from './server/ai_translations.ts';
import * as analyticsModule from './server/analytics.ts';
import * as kpiModule from './server/kpi.ts';
import * as growthModule from './server/growth.ts';
import * as forecastingModule from './server/forecasting.ts';
import * as briefingModule from './server/briefing.ts';
import * as simulationModule from './server/simulation.ts';
import * as warehousesModule from './server/warehouses.ts';
import * as brandsModule from './server/brands.ts';
import * as productImportModule from './server/product_import.ts';
import * as healthMonitorModule from './server/health_monitor.ts';
