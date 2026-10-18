import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Search & List Services
router.get('/', (req: Request, res: Response): void => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';

    let sql = 'SELECT * FROM services WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (q) {
      const wildcard = `%${q}%`;
      sql += ` AND (
        title_en LIKE ? OR title_hi LIKE ? OR title_mr LIKE ?
        OR description_en LIKE ? OR description_hi LIKE ? OR description_mr LIKE ?
        OR category LIKE ? OR slug LIKE ?
      )`;
      params.push(wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard);
    }

    sql += ' ORDER BY id ASC';

    const services = db.prepare(sql).all(...params) as any[];

    // Parse JSON steps and format summary
    const formatted = services.map(s => {
      let procedure = [];
      try {
        procedure = JSON.parse(s.procedure_steps_json);
      } catch (e) {}

      // Get requirement count
      const reqCount = (db.prepare('SELECT count(*) as count FROM service_requirements WHERE service_id = ?').get(s.id) as any).count;

      return {
        id: s.id,
        slug: s.slug,
        category: s.category,
        title_en: s.title_en,
        title_hi: s.title_hi,
        title_mr: s.title_mr,
        subtitle_en: s.subtitle_en,
        subtitle_hi: s.subtitle_hi,
        subtitle_mr: s.subtitle_mr,
        description_en: s.description_en,
        description_hi: s.description_hi,
        description_mr: s.description_mr,
        fees_info_en: s.fees_info_en,
        fees_info_hi: s.fees_info_hi,
        fees_info_mr: s.fees_info_mr,
        processing_time_en: s.processing_time_en,
        processing_time_hi: s.processing_time_hi,
        processing_time_mr: s.processing_time_mr,
        official_source_name: s.official_source_name,
        official_source_url: s.official_source_url,
        last_verified_date: s.last_verified_date,
        verification_status: s.verification_status,
        applicable_office_category: s.applicable_office_category,
        totalRequirements: reqCount,
        stepCount: procedure.length
      };
    });

    res.json({ services: formatted, total: formatted.length });
  } catch (err: any) {
    console.error('Fetch services error:', err);
    res.status(500).json({ error: 'Failed to retrieve documentation services.' });
  }
});

// Categories with counts
router.get('/categories', (req: Request, res: Response): void => {
  try {
    const categories = db.prepare(`
      SELECT category, count(*) as count 
      FROM services 
      GROUP BY category 
      ORDER BY count DESC
    `).all();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});

// Saved Guidance for Authenticated User
router.get('/saved', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const saved = db.prepare(`
      SELECT s.*, sg.created_at as saved_at 
      FROM saved_guidance sg 
      JOIN services s ON sg.service_id = s.id 
      WHERE sg.user_id = ? 
      ORDER BY sg.created_at DESC
    `).all(req.user!.id);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch saved services.' });
  }
});

// Save or Unsave a Service
router.post('/:id/toggle-save', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const serviceId = Number(req.params.id);
    const userId = req.user!.id;

    const existing = db.prepare('SELECT id FROM saved_guidance WHERE user_id = ? AND service_id = ?').get(userId, serviceId);

    if (existing) {
      db.prepare('DELETE FROM saved_guidance WHERE user_id = ? AND service_id = ?').run(userId, serviceId);
      res.json({ saved: false, message: 'Service removed from saved items.' });
    } else {
      db.prepare('INSERT INTO saved_guidance (user_id, service_id) VALUES (?, ?)').run(userId, serviceId);
      res.json({ saved: true, message: 'Service saved to your profile.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle save status.' });
  }
});

// Service Details with Requirements, Alternatives, and Step-by-Step Procedure
router.get('/:slug', (req: Request, res: Response): void => {
  try {
    const { slug } = req.params;
    const service = db.prepare('SELECT * FROM services WHERE slug = ?').get(slug) as any;

    if (!service) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }

    // Get requirements
    const requirements = db.prepare(`
      SELECT * FROM service_requirements 
      WHERE service_id = ? 
      ORDER BY order_num ASC
    `).all(service.id) as any[];

    const formattedRequirements = requirements.map(r => {
      let alternatives: string[] = [];
      let howToObtain: any = null;
      try {
        if (r.accepted_alternatives_json) alternatives = JSON.parse(r.accepted_alternatives_json);
      } catch (e) {}
      try {
        if (r.how_to_obtain_json) howToObtain = JSON.parse(r.how_to_obtain_json);
      } catch (e) {}

      return {
        id: r.id,
        service_id: r.service_id,
        name_en: r.name_en,
        name_hi: r.name_hi,
        name_mr: r.name_mr,
        purpose_en: r.purpose_en,
        purpose_hi: r.purpose_hi,
        purpose_mr: r.purpose_mr,
        requirement_type: r.requirement_type,
        accepted_alternatives: alternatives,
        format_conditions_en: r.format_conditions_en,
        format_conditions_hi: r.format_conditions_hi,
        format_conditions_mr: r.format_conditions_mr,
        how_to_obtain: howToObtain,
        order_num: r.order_num
      };
    });

    let procedureSteps = [];
    try {
      procedureSteps = JSON.parse(service.procedure_steps_json);
    } catch (e) {}

    // Find nearby eligible offices
    const offices = db.prepare(`
      SELECT * FROM offices 
      WHERE category = ? OR category LIKE ? 
      LIMIT 5
    `).all(service.applicable_office_category, `%${service.applicable_office_category}%`);

    res.json({
      service: {
        ...service,
        procedure_steps: procedureSteps
      },
      requirements: formattedRequirements,
      eligibleOffices: offices
    });
  } catch (err: any) {
    console.error('Fetch service detail error:', err);
    res.status(500).json({ error: 'Failed to retrieve service guidance details.' });
  }
});

// Citizen Report / Feedback on Service
router.post('/report-issue', (req: Request, res: Response): void => {
  try {
    const { serviceId, reportType, queryText, details } = req.body;
    if (!details || details.trim().length < 5) {
      res.status(400).json({ error: 'Please provide detailed information about the issue or missing document.' });
      return;
    }

    const authHeader = req.headers['authorization'];
    let userId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'docease_dev_secret_key_8f7b2c9d1e4a6f8b0c2d4e6a8f1b3c5d');
        userId = decoded.id;
      } catch (e) {}
    }

    db.prepare(`
      INSERT INTO feedback_reports (user_id, service_id, report_type, query_text, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, serviceId || null, reportType || 'missing_info', queryText || null, details.trim());

    res.status(201).json({
      success: true,
      message: 'Thank you for your report. Our documentation verification team will review this information against official gazettes.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record report.' });
  }
});

export default router;
