import jwt from 'jsonwebtoken';
import { config } from '../config.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

export function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

export function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, config.jwtSecret);
    } catch {
      req.user = null;
    }
  }
  return next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required.' });
  }
  return next();
}
