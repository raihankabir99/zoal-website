import express from 'express';
import * as cmsModule from '../server/cms.ts';
import { authenticateRequest, requireRole } from '../backend/security.ts';

const app = express();

app.use(express.json({ limit: '10mb' }));

// Keep CMS reads compatible with the existing public storefront contract.
app.get('/api/cms', cmsModule.getCmsData);

// CMS mutations must be authenticated and restricted to existing staff/admin roles.
app.put(
  '/api/cms/pages/:id',
  authenticateRequest,
  requireRole(['staff', 'manager', 'admin', 'owner']),
  cmsModule.updateCmsPage
);

export default app;
