import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Middleware: ensure user is official and approved
function requireApprovedOfficial(req: AuthenticatedRequest, res: Response, next: () => void) {
  if (req.user?.role === 'admin') {
    return next();
  }

  const profile = db.prepare('SELECT status, office_id, department, designation FROM official_profiles WHERE user_id = ?').get(req.user!.id) as any;
  if (!profile || profile.status !== 'approved') {
    res.status(403).json({ error: 'Access restricted: Your official account has not yet received administrative approval.' });
    return;
  }

  (req as any).officialProfile = profile;
  next();
}

router.use(authenticateToken);
router.use(requireRole(['official', 'admin']));
router.use(requireApprovedOfficial);

// Official Dashboard Stats & Overview
router.get('/dashboard', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const profile = (req as any).officialProfile;
    const officeId = profile?.office_id;

    let apptFilter = officeId ? 'WHERE a.office_id = ?' : 'WHERE 1=1';
    const params = officeId ? [officeId] : [];

    const totalAssigned = (db.prepare(`SELECT count(*) as count FROM appointments a ${apptFilter}`).get(...params) as any).count;
    const confirmedCount = (db.prepare(`SELECT count(*) as count FROM appointments a ${apptFilter} AND a.status = 'confirmed'`).get(...params) as any).count;
    const completedCount = (db.prepare(`SELECT count(*) as count FROM appointments a ${apptFilter} AND a.status = 'completed'`).get(...params) as any).count;

    // Today's appointments
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = (db.prepare(`SELECT count(*) as count FROM appointments a ${apptFilter} AND a.appointment_date = ?`).get(...(officeId ? [officeId, todayStr] : [todayStr])) as any).count;

    let officeDetails = null;
    if (officeId) {
      officeDetails = db.prepare('SELECT * FROM offices WHERE id = ?').get(officeId);
    }

    res.json({
      officialProfile: profile,
      office: officeDetails,
      stats: {
        totalAssigned,
        confirmedCount,
        completedCount,
        todayCount
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve official dashboard metrics.' });
  }
});

// List assigned appointments
router.get('/appointments', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const profile = (req as any).officialProfile;
    const officeId = profile?.office_id;
    const date = typeof req.query.date === 'string' ? req.query.date : '';
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    let sql = `
      SELECT 
        a.id, a.appointment_number, a.appointment_date, a.time_slot, a.status, a.citizen_notes, a.created_at,
        u.full_name as citizen_name, u.mobile as citizen_mobile, u.email as citizen_email,
        s.title_en as service_title, s.slug as service_slug,
        o.name as office_name
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      JOIN services s ON a.service_id = s.id
      JOIN offices o ON a.office_id = o.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (officeId) {
      sql += ' AND a.office_id = ?';
      params.push(officeId);
    }

    if (date) {
      sql += ' AND a.appointment_date = ?';
      params.push(date);
    }

    if (status && status !== 'all') {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (a.appointment_number LIKE ? OR u.full_name LIKE ? OR u.mobile LIKE ?)';
      const wildcard = `%${search}%`;
      params.push(wildcard, wildcard, wildcard);
    }

    sql += ' ORDER BY a.appointment_date ASC, a.time_slot ASC';

    const appointments = db.prepare(sql).all(...params);
    res.json(appointments);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve appointments.' });
  }
});

// QR Code Verification Endpoint
router.post('/verify-qr', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { qrToken } = req.body;

    if (!qrToken || typeof qrToken !== 'string' || !qrToken.startsWith('vtoken_')) {
      res.status(400).json({ error: 'Invalid QR token format.' });
      return;
    }

    const appt = db.prepare(`
      SELECT 
        a.id, a.appointment_number, a.user_id, a.service_id, a.office_id, a.appointment_date, a.time_slot, a.status, a.citizen_notes,
        u.full_name as citizen_name, u.mobile as citizen_mobile, u.city as citizen_city,
        s.title_en as service_title, s.slug as service_slug,
        o.name as office_name
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      JOIN services s ON a.service_id = s.id
      JOIN offices o ON a.office_id = o.id
      WHERE a.qr_token = ?
    `).get(qrToken) as any;

    if (!appt) {
      res.status(404).json({ error: 'QR Code is unrecognized or does not correspond to any valid appointment record.' });
      return;
    }

    // Check status
    if (appt.status === 'cancelled') {
      res.status(400).json({
        valid: false,
        error: `Appointment ${appt.appointment_number} was CANCELLED by citizen. Verification revoked.`
      });
      return;
    }

    // Check checklist status for citizen for this service
    const checklist = db.prepare(`
      SELECT 
        c.id, c.status,
        (SELECT count(*) FROM user_checklist_items uci WHERE uci.checklist_id = c.id) as total_items,
        (SELECT count(*) FROM user_checklist_items uci WHERE uci.checklist_id = c.id AND uci.status = 'available') as available_items,
        (SELECT count(*) FROM user_checklist_items uci WHERE uci.checklist_id = c.id AND uci.status = 'missing') as missing_items
      FROM user_checklists c
      WHERE c.user_id = ? AND c.service_id = ?
    `).get(appt.user_id, appt.service_id) as any;

    // Previous verification records
    const previousVerifications = db.prepare(`
      SELECT qv.*, u.full_name as verified_by_name 
      FROM qr_verifications qv 
      JOIN users u ON qv.verified_by_user_id = u.id 
      WHERE qv.appointment_id = ? 
      ORDER BY qv.verified_at DESC
    `).all(appt.id);

    res.json({
      valid: true,
      appointment: {
        id: appt.id,
        appointment_number: appt.appointment_number,
        citizen_name: appt.citizen_name,
        citizen_mobile: appt.citizen_mobile,
        service_title: appt.service_title,
        office_name: appt.office_name,
        appointment_date: appt.appointment_date,
        time_slot: appt.time_slot,
        status: appt.status,
        citizen_notes: appt.citizen_notes
      },
      citizenChecklist: checklist ? {
        status: checklist.status,
        totalItems: checklist.total_items,
        availableItems: checklist.available_items,
        missingItems: checklist.missing_items,
        ready: checklist.missing_items === 0
      } : { status: 'none', totalItems: 0, availableItems: 0, missingItems: 0, ready: false },
      previousVerifications
    });
  } catch (err: any) {
    console.error('QR verification error:', err);
    res.status(500).json({ error: 'Server error during QR verification.' });
  }
});

// Record Official Verification Outcome
router.post('/record-outcome', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { appointmentId, status, notes } = req.body;
    const officialUserId = req.user!.id;

    if (!appointmentId || !['verified', 'flagged_issues', 'completed'].includes(status)) {
      res.status(400).json({ error: 'Appointment ID and valid outcome status (verified, flagged_issues, completed) are required.' });
      return;
    }

    const appt = db.prepare('SELECT id, appointment_number, office_id FROM appointments WHERE id = ?').get(appointmentId) as any;
    if (!appt) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    // Insert verification log
    db.prepare(`
      INSERT INTO qr_verifications (appointment_id, verified_by_user_id, status, notes)
      VALUES (?, ?, ?, ?)
    `).run(appointmentId, officialUserId, status, notes || null);

    // Update appointment status if marked verified or completed
    const newStatus = status === 'completed' || status === 'verified' ? 'completed' : 'confirmed';
    db.prepare('UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, appointmentId);

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(officialUserId, 'OFFICIAL_VERIFIED_OUTCOME', 'appointment', String(appointmentId), `Outcome: ${status}. Notes: ${notes || 'None'}`);

    res.json({
      success: true,
      message: `Verification outcome recorded as '${status}'.`,
      newAppointmentStatus: newStatus
    });
  } catch (err: any) {
    console.error('Record outcome error:', err);
    res.status(500).json({ error: 'Failed to record verification outcome.' });
  }
});

// Audit History for Official
router.get('/audit-logs', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const logs = db.prepare(`
      SELECT qv.*, a.appointment_number, u.full_name as citizen_name, s.title_en as service_title
      FROM qr_verifications qv
      JOIN appointments a ON qv.appointment_id = a.id
      JOIN users u ON a.user_id = u.id
      JOIN services s ON a.service_id = s.id
      WHERE qv.verified_by_user_id = ?
      ORDER BY qv.verified_at DESC
      LIMIT 50
    `).all(req.user!.id);

    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve audit history.' });
  }
});

export default router;
