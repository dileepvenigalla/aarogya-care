import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { authenticate } from '../middleware/auth.js';

function sanitizeUser(row) {
  if (!row) return null;
  const { password_hash: _ignored, ...safe } = row;
  return safe;
}

function issueToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

export function createAuthRouter(db) {
  const router = Router();

  router.post('/register', async (req, res) => {
    const { name, email, phone, dob, gender, password } = req.body || {};

    if (!name || String(name).trim().length < 3) {
      return res.status(400).json({ error: 'Full name must be at least 3 characters.' });
    }
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!/^\d{10}$/.test(String(phone || '').trim())) {
      return res.status(400).json({ error: 'Phone number must be 10 digits.' });
    }
    if (!dob || !gender) {
      return res.status(400).json({ error: 'Date of birth and gender are required.' });
    }
    if (!/^(?=.*\d).{8,}$/.test(String(password || ''))) {
      return res.status(400).json({ error: 'Password must be at least 8 characters and include a number.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'That email is already registered.' });
    }

    let id = '';
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = `PT${Math.floor(10000 + Math.random() * 90000)}`;
      if (!db.prepare('SELECT id FROM users WHERE id = ?').get(candidate)) {
        id = candidate;
        break;
      }
    }
    if (!id) {
      id = `PT${Date.now().toString().slice(-6)}`;
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const createdAt = new Date().toISOString().slice(0, 10);

    db.prepare(
      `INSERT INTO users (id, role, name, email, phone, dob, gender, password_hash, created_at)
       VALUES (?, 'patient', ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      String(name).trim(),
      cleanEmail,
      String(phone).trim(),
      String(dob).trim(),
      String(gender).trim(),
      passwordHash,
      createdAt
    );

    const user = sanitizeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
    const token = issueToken(user);

    return res.status(201).json({ token, user });
  });

  router.post('/login', async (req, res) => {
    const identifier = String(req.body?.identifier || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/Patient ID and password are required.' });
    }

    const userRow = db
      .prepare('SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(id) = ?')
      .get(identifier, identifier);

    if (!userRow) {
      return res.status(401).json({ error: 'Incorrect ID/email or password.' });
    }

    const valid = await bcrypt.compare(password, userRow.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect ID/email or password.' });
    }

    const user = sanitizeUser(userRow);
    const token = issueToken(user);
    return res.json({ token, user });
  });

  router.get('/me', authenticate, (req, res) => {
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!userRow) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    return res.json({ user: sanitizeUser(userRow) });
  });

  return router;
}
