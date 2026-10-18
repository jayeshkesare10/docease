import { Router, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const vaultDir = path.resolve(__dirname, '../../data/vault_storage');

if (!fs.existsSync(vaultDir)) {
  fs.mkdirSync(vaultDir, { recursive: true });
}

// Multer private storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, vaultDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    cb(null, safeName);
  }
});

const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF, JPG, PNG, and WebP files up to 10MB are permitted.'));
    }
  }
});

const router = Router();

// List user documents in vault
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const docs = db.prepare(`
      SELECT id, original_name, file_size, mime_type, category, title, notes, created_at
      FROM vault_documents 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(userId);

    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve vault documents.' });
  }
});

// Upload document
router.post('/upload', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  upload.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'File exceeds maximum limit of 10MB.' });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    } else if (err) {
      res.status(400).json({ error: err.message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No document file was uploaded.' });
      return;
    }

    try {
      const { title, category, notes } = req.body;
      const userId = req.user!.id;

      const docTitle = title && title.trim().length > 0 ? title.trim() : req.file.originalname;
      const docCategory = category || 'General';

      const insert = db.prepare(`
        INSERT INTO vault_documents (
          user_id, original_name, stored_filename, file_size, mime_type, category, title, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insert.run(
        userId,
        req.file.originalname,
        req.file.filename,
        req.file.size,
        req.file.mimetype,
        docCategory,
        docTitle,
        notes || null
      );

      db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)')
        .run(userId, 'VAULT_FILE_UPLOADED', 'vault_document', String(result.lastInsertRowid), `Uploaded ${req.file.originalname} (${docCategory})`);

      res.status(201).json({
        success: true,
        message: 'Document stored securely in private vault.',
        document: {
          id: result.lastInsertRowid,
          title: docTitle,
          category: docCategory,
          original_name: req.file.originalname,
          file_size: req.file.size,
          mime_type: req.file.mimetype
        }
      });
    } catch (dbErr: any) {
      // Clean up file if db insertion fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to record document metadata.' });
    }
  });
});

// Secure Download
router.get('/download/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const docId = Number(req.params.id);
    const userId = req.user!.id;

    const doc = db.prepare('SELECT * FROM vault_documents WHERE id = ? AND user_id = ?').get(docId, userId) as any;

    if (!doc) {
      res.status(404).json({ error: 'Document not found or access unauthorized.' });
      return;
    }

    const filePath = path.resolve(vaultDir, doc.stored_filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Storage file not found on disk.' });
      return;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.original_name)}"`);
    res.setHeader('Content-Type', doc.mime_type);
    fs.createReadStream(filePath).pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: 'Error downloading document.' });
  }
});

// Secure Inline View
router.get('/view/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const docId = Number(req.params.id);
    const userId = req.user!.id;

    const doc = db.prepare('SELECT * FROM vault_documents WHERE id = ? AND user_id = ?').get(docId, userId) as any;

    if (!doc) {
      res.status(404).json({ error: 'Document not found or access unauthorized.' });
      return;
    }

    const filePath = path.resolve(vaultDir, doc.stored_filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Storage file not found.' });
      return;
    }

    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.original_name)}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: 'Error viewing document.' });
  }
});

// Delete Document
router.delete('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const docId = Number(req.params.id);
    const userId = req.user!.id;

    const doc = db.prepare('SELECT * FROM vault_documents WHERE id = ? AND user_id = ?').get(docId, userId) as any;

    if (!doc) {
      res.status(404).json({ error: 'Document not found or access unauthorized.' });
      return;
    }

    // Delete file from disk
    const filePath = path.resolve(vaultDir, doc.stored_filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM vault_documents WHERE id = ? AND user_id = ?').run(docId, userId);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(userId, 'VAULT_FILE_DELETED', 'vault_document', String(docId), `Deleted ${doc.original_name}`);

    res.json({ success: true, message: 'Document permanently deleted from vault.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete document.' });
  }
});

export default router;
