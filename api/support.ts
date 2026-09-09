import express from 'express';
import * as supportModule from '../server/support';
import { authenticateRequest, requireRole } from '../backend/security';

const app = express();

app.use(express.json({ limit: '10mb' }));

// Dedicated production route: keeps Support Center traffic ahead of the legacy catch-all.
app.get('/api/support/tickets', authenticateRequest, supportModule.getTickets);
app.post('/api/support/tickets', authenticateRequest, supportModule.createTicket);
app.post('/api/support/tickets/:id/messages', authenticateRequest, supportModule.addMessage);
app.put('/api/support/tickets/:id', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), supportModule.updateTicket);
app.post('/api/support/tickets/:id/attachments', authenticateRequest, supportModule.uploadTicketAttachment);
app.get('/api/support/attachments/:id/download', authenticateRequest, supportModule.downloadTicketAttachment);

app.get('/api/support/kb', authenticateRequest, supportModule.getKBArticles);
app.post('/api/support/kb', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), supportModule.createKBArticle);
app.put('/api/support/kb/:id', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), supportModule.updateKBArticle);
app.delete('/api/support/kb/:id', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), supportModule.deleteKBArticle);

app.get('/api/support/staff', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), supportModule.getStaffRoster);
app.post('/api/support/logs', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), supportModule.createSupportLog);
app.get('/api/support/logs', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), supportModule.getSupportLogs);
app.get('/api/support/reports', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), supportModule.getSupportReports);

export default app;
