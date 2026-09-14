import serverBundle from '../dist/server.cjs';
import * as staffModule from '../server/staff';
import {
  authenticateRequest,
  requireRole
} from '../backend/security';

const app = serverBundle.default || serverBundle;

// Staff operations API is registered here because the bundled server source
// already imports the staff module but does not expose these routes itself.
const staffRoles = ['staff', 'manager', 'admin', 'owner'];
app.get('/api/staff', authenticateRequest, requireRole(staffRoles), staffModule.getStaffRoster);
app.put('/api/staff', authenticateRequest, requireRole(staffRoles), staffModule.updateStaffOrder);
app.get('/api/staff/duty-status', authenticateRequest, requireRole(staffRoles), staffModule.getDutyStatus);
app.put('/api/staff/duty-status', authenticateRequest, requireRole(staffRoles), staffModule.updateDutyStatus);
app.get('/api/staff/logs', authenticateRequest, requireRole(staffRoles), staffModule.getStaffLogs);
app.post('/api/staff/logs', authenticateRequest, requireRole(staffRoles), staffModule.createStaffLog);

export default app;
