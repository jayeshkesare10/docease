import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';

const router = Router();

// List user's checklists
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.id;

    const checklists = db.prepare(`
      SELECT 
        c.*,
        s.slug as service_slug,
        s.category as service_category,
        s.title_en as service_title_en,
        s.title_hi as service_title_hi,
        s.title_mr as service_title_mr,
        s.applicable_office_category,
        s.official_source_url,
        (SELECT count(*) FROM user_checklist_items uci WHERE uci.checklist_id = c.id) as total_items,
        (SELECT count(*) FROM user_checklist_items uci WHERE uci.checklist_id = c.id AND uci.status = 'available') as available_items,
        (SELECT count(*) FROM user_checklist_items uci WHERE uci.checklist_id = c.id AND uci.status = 'missing') as missing_items
      FROM user_checklists c
      JOIN services s ON c.service_id = s.id
      WHERE c.user_id = ?
      ORDER BY c.updated_at DESC
    `).all(userId) as any[];

    const withProgress = checklists.map(c => {
      const progressPercent = c.total_items > 0 ? Math.round((c.available_items / c.total_items) * 100) : 0;
      return {
        ...c,
        progressPercent,
        isComplete: c.total_items > 0 && c.missing_items === 0
      };
    });

    res.json(withProgress);
  } catch (err: any) {
    console.error('List checklists error:', err);
    res.status(500).json({ error: 'Failed to retrieve checklists.' });
  }
});

// Start or get checklist for a service
router.post('/start', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { serviceId, title } = req.body;
    const userId = req.user!.id;

    if (!serviceId) {
      res.status(400).json({ error: 'Service ID is required.' });
      return;
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId) as any;
    if (!service) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }

    // Check if user already has an active checklist for this service
    let checklist = db.prepare('SELECT * FROM user_checklists WHERE user_id = ? AND service_id = ?').get(userId, serviceId) as any;

    if (!checklist) {
      const defaultTitle = title || `${service.title_en} Checklist`;
      const result = db.prepare(`
        INSERT INTO user_checklists (user_id, service_id, title, status)
        VALUES (?, ?, ?, 'in_progress')
      `).run(userId, serviceId, defaultTitle);

      const checklistId = Number(result.lastInsertRowid);

      // Populate items from service_requirements (initial status 'missing')
      const requirements = db.prepare('SELECT id FROM service_requirements WHERE service_id = ?').all(serviceId) as any[];
      const insertItem = db.prepare(`
        INSERT INTO user_checklist_items (checklist_id, requirement_id, status)
        VALUES (?, ?, 'missing')
      `);

      for (const reqItem of requirements) {
        insertItem.run(checklistId, reqItem.id);
      }

      checklist = db.prepare('SELECT * FROM user_checklists WHERE id = ?').get(checklistId) as any;
    }

    // Return detailed checklist
    res.status(201).json({ success: true, checklistId: checklist.id });
  } catch (err: any) {
    console.error('Start checklist error:', err);
    res.status(500).json({ error: 'Failed to start checklist.' });
  }
});

// Get detailed checklist by ID
router.get('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const checklistId = Number(req.params.id);
    const userId = req.user!.id;

    const checklist = db.prepare(`
      SELECT c.*, s.slug as service_slug, s.title_en as service_title_en, s.title_hi as service_title_hi, s.title_mr as service_title_mr,
             s.applicable_office_category, s.official_source_name, s.official_source_url
      FROM user_checklists c
      JOIN services s ON c.service_id = s.id
      WHERE c.id = ? AND c.user_id = ?
    `).get(checklistId, userId) as any;

    if (!checklist) {
      res.status(404).json({ error: 'Checklist not found.' });
      return;
    }

    // Fetch items with requirement metadata
    const items = db.prepare(`
      SELECT 
        uci.id as item_id,
        uci.status,
        uci.user_notes,
        uci.updated_at as item_updated_at,
        sr.id as requirement_id,
        sr.name_en,
        sr.name_hi,
        sr.name_mr,
        sr.purpose_en,
        sr.purpose_hi,
        sr.purpose_mr,
        sr.requirement_type,
        sr.accepted_alternatives_json,
        sr.format_conditions_en,
        sr.format_conditions_hi,
        sr.format_conditions_mr,
        sr.how_to_obtain_json,
        sr.order_num
      FROM user_checklist_items uci
      JOIN service_requirements sr ON uci.requirement_id = sr.id
      WHERE uci.checklist_id = ?
      ORDER BY sr.order_num ASC
    `).all(checklistId) as any[];

    const formattedItems = items.map(item => {
      let alternatives = [];
      let howToObtain = null;
      try {
        if (item.accepted_alternatives_json) alternatives = JSON.parse(item.accepted_alternatives_json);
      } catch (e) {}
      try {
        if (item.how_to_obtain_json) howToObtain = JSON.parse(item.how_to_obtain_json);
      } catch (e) {}

      return {
        ...item,
        accepted_alternatives: alternatives,
        how_to_obtain: howToObtain
      };
    });

    const total = formattedItems.length;
    const available = formattedItems.filter(i => i.status === 'available').length;
    const missing = formattedItems.filter(i => i.status === 'missing').length;
    const notApplicable = formattedItems.filter(i => i.status === 'not_applicable').length;
    const progressPercent = total > 0 ? Math.round((available / total) * 100) : 0;

    res.json({
      checklist,
      items: formattedItems,
      summary: {
        total,
        available,
        missing,
        notApplicable,
        progressPercent,
        isReadyForNextStep: missing === 0
      }
    });
  } catch (err: any) {
    console.error('Fetch checklist error:', err);
    res.status(500).json({ error: 'Failed to retrieve checklist details.' });
  }
});

// Update item status and notes
router.put('/items/:itemId', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const itemId = Number(req.params.itemId);
    const { status, userNotes } = req.body;
    const userId = req.user!.id;

    if (!['available', 'missing', 'not_applicable'].includes(status)) {
      res.status(400).json({ error: 'Invalid item status. Allowed: available, missing, not_applicable.' });
      return;
    }

    // Verify ownership
    const item = db.prepare(`
      SELECT uci.id, uci.checklist_id 
      FROM user_checklist_items uci 
      JOIN user_checklists uc ON uci.checklist_id = uc.id 
      WHERE uci.id = ? AND uc.user_id = ?
    `).get(itemId, userId) as any;

    if (!item) {
      res.status(404).json({ error: 'Checklist item not found or unauthorized.' });
      return;
    }

    db.prepare(`
      UPDATE user_checklist_items 
      SET status = ?, user_notes = COALESCE(?, user_notes), updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(status, userNotes !== undefined ? userNotes : null, itemId);

    // Update parent checklist updated_at
    db.prepare('UPDATE user_checklists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(item.checklist_id);

    // Check if all are available/not_applicable to update status
    const pendingMissing = (db.prepare(`
      SELECT count(*) as count 
      FROM user_checklist_items 
      WHERE checklist_id = ? AND status = 'missing'
    `).get(item.checklist_id) as any).count;

    const newChecklistStatus = pendingMissing === 0 ? 'completed' : 'in_progress';
    db.prepare('UPDATE user_checklists SET status = ? WHERE id = ?').run(newChecklistStatus, item.checklist_id);

    res.json({
      success: true,
      status,
      userNotes,
      checklistStatus: newChecklistStatus
    });
  } catch (err: any) {
    console.error('Update checklist item error:', err);
    res.status(500).json({ error: 'Failed to update checklist item.' });
  }
});

// Delete checklist
router.delete('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const checklistId = Number(req.params.id);
    const userId = req.user!.id;

    const result = db.prepare('DELETE FROM user_checklists WHERE id = ? AND user_id = ?').run(checklistId, userId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Checklist not found.' });
      return;
    }

    res.json({ success: true, message: 'Checklist removed.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete checklist.' });
  }
});

export default router;
