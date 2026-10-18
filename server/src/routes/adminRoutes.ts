import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../auth.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['admin']));

// List Pending Official Registrations
router.get('/officials/pending', (_req: AuthenticatedRequest, res: Response): void => {
  try {
    const pending = db.prepare(`
      SELECT 
        p.id as profile_id, p.user_id, p.department, p.designation, p.employee_id, p.status, p.created_at,
        u.full_name, u.email, u.mobile, u.preferred_language,
        o.name as office_name
      FROM official_profiles p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN offices o ON p.office_id = o.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at ASC
    `).all();

    res.json(pending);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve pending officials.' });
  }
});

// Approve Official Registration
router.post('/officials/:profileId/approve', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const profileId = Number(req.params.profileId);
    const adminId = req.user!.id;

    const profile = db.prepare('SELECT user_id, status FROM official_profiles WHERE id = ?').get(profileId) as any;
    if (!profile) {
      res.status(404).json({ error: 'Official profile not found.' });
      return;
    }

    db.prepare(`
      UPDATE official_profiles 
      SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(adminId, profileId);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(adminId, 'ADMIN_APPROVED_OFFICIAL', 'official_profile', String(profileId), `Approved official user ${profile.user_id}`);

    res.json({ success: true, message: 'Official registration approved. Privileges activated.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to approve official.' });
  }
});

// Reject Official Registration
router.post('/officials/:profileId/reject', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const profileId = Number(req.params.profileId);
    const { reason } = req.body;
    const adminId = req.user!.id;

    db.prepare(`
      UPDATE official_profiles 
      SET status = 'rejected', rejection_reason = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(reason || 'Verification criteria not satisfied', adminId, profileId);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(adminId, 'ADMIN_REJECTED_OFFICIAL', 'official_profile', String(profileId), `Reason: ${reason}`);

    res.json({ success: true, message: 'Official registration rejected.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reject official.' });
  }
});

// Add New Documentation Service
router.post('/services', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const {
      slug, category, titleEn, titleHi, titleMr,
      descriptionEn, descriptionHi, descriptionMr,
      eligibilityEn, eligibilityHi, eligibilityMr,
      procedureSteps, officialSourceName, officialSourceUrl,
      lastVerifiedDate, verificationStatus, applicableOfficeCategory
    } = req.body;

    if (!slug || !category || !titleEn || !descriptionEn || !officialSourceName || !officialSourceUrl) {
      res.status(400).json({ error: 'Slug, category, English title, description, and official source details are required.' });
      return;
    }

    const insert = db.prepare(`
      INSERT INTO services (
        slug, category, title_en, title_hi, title_mr,
        description_en, description_hi, description_mr,
        eligibility_en, eligibility_hi, eligibility_mr,
        procedure_steps_json, official_source_name, official_source_url,
        last_verified_date, verification_status, applicable_office_category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      slug.trim().toLowerCase(),
      category.trim(),
      titleEn.trim(),
      titleHi || titleEn,
      titleMr || titleEn,
      descriptionEn.trim(),
      descriptionHi || descriptionEn,
      descriptionMr || descriptionEn,
      eligibilityEn || 'Indian citizens',
      eligibilityHi || 'भारतीय नागरिक',
      eligibilityMr || 'भारतीय नागरिक',
      JSON.stringify(procedureSteps || []),
      officialSourceName.trim(),
      officialSourceUrl.trim(),
      lastVerifiedDate || new Date().toISOString().split('T')[0],
      verificationStatus || 'verified',
      applicableOfficeCategory || 'District Facilitation Center'
    );

    res.status(201).json({ success: true, serviceId: result.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create service entry.' });
  }
});

// Update Existing Service Guidance
router.put('/services/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const serviceId = Number(req.params.id);
    const {
      titleEn, titleHi, titleMr,
      descriptionEn, descriptionHi, descriptionMr,
      eligibilityEn, eligibilityHi, eligibilityMr,
      feesInfoEn, processingTimeEn,
      officialSourceName, officialSourceUrl,
      lastVerifiedDate, verificationStatus
    } = req.body;

    db.prepare(`
      UPDATE services 
      SET title_en = COALESCE(?, title_en),
          title_hi = COALESCE(?, title_hi),
          title_mr = COALESCE(?, title_mr),
          description_en = COALESCE(?, description_en),
          description_hi = COALESCE(?, description_hi),
          description_mr = COALESCE(?, description_mr),
          eligibility_en = COALESCE(?, eligibility_en),
          eligibility_hi = COALESCE(?, eligibility_hi),
          eligibility_mr = COALESCE(?, eligibility_mr),
          fees_info_en = COALESCE(?, fees_info_en),
          processing_time_en = COALESCE(?, processing_time_en),
          official_source_name = COALESCE(?, official_source_name),
          official_source_url = COALESCE(?, official_source_url),
          last_verified_date = COALESCE(?, last_verified_date),
          verification_status = COALESCE(?, verification_status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      titleEn, titleHi, titleMr,
      descriptionEn, descriptionHi, descriptionMr,
      eligibilityEn, eligibilityHi, eligibilityMr,
      feesInfoEn, processingTimeEn,
      officialSourceName, officialSourceUrl,
      lastVerifiedDate, verificationStatus,
      serviceId
    );

    res.json({ success: true, message: 'Documentation guidance updated and logged.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update service.' });
  }
});

// List Citizen Feedback & Missing Information Reports
router.get('/feedback', (_req: AuthenticatedRequest, res: Response): void => {
  try {
    const feedback = db.prepare(`
      SELECT f.*, u.full_name as citizen_name, u.email as citizen_email, s.title_en as service_title
      FROM feedback_reports f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN services s ON f.service_id = s.id
      ORDER BY f.created_at DESC
    `).all();

    res.json(feedback);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve feedback reports.' });
  }
});

export default router;
