import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { initDatabase, db } from './db.js';
import { hashPassword } from './auth.js';

import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import checklistRoutes from './routes/checklistRoutes.js';
import vaultRoutes from './routes/vaultRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import officialRoutes from './routes/officialRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite database and seed initial data
initDatabase();

// Seed initial administrative system user if not present
const existingAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
if (!existingAdmin) {
  const { hash, salt } = hashPassword('Admin@DocEase2026!');
  db.prepare(`
    INSERT INTO users (
      email, password_hash, salt, full_name, role, is_verified, preferred_language
    ) VALUES (?, ?, ?, ?, 'admin', 1, 'en')
  `).run('admin@docease.gov.in', hash, salt, 'DocEase Administrator');
  console.log('[SECURITY SETUP] Initial administrator account initialized: admin@docease.gov.in');
}

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'DOCEASE API Engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/official', officialRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler for undefined API routes
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve frontend client build in production
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[UNHANDLED ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected error occurred on the server.'
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`DOCEASE API Backend Engine is running on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

export default app;
