import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initDatabase } from './db.js';
import { createAuthRouter } from './routes/auth.js';
import { createPublicRouter } from './routes/public.js';
import { createAppointmentsRouter } from './routes/appointments.js';
import { createPatientRouter } from './routes/patient.js';
import { createAdminRouter } from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(options = {}) {
  const dbPath = options.dbPath ?? config.dbPath;
  const db = initDatabase(dbPath);
  const app = express();

  app.use(
    cors({
      origin: options.corsOrigin ?? true,
      credentials: true,
    })
  );
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'aarogya-care-api' });
  });

  app.use('/api/auth', createAuthRouter(db));
  app.use('/api', createPublicRouter(db));
  app.use('/api/appointments', createAppointmentsRouter(db));
  app.use('/api/patient', createPatientRouter(db));
  app.use('/api/admin', createAdminRouter(db));

  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      return res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return { app, db };
}
