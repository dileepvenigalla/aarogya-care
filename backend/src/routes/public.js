import { Router } from 'express';

export function createPublicRouter(db) {
  const router = Router();

  router.get('/departments', (_req, res) => {
    const departments = db
      .prepare(
        `SELECT d.*, COUNT(doc.id) AS doctor_count
         FROM departments d
         LEFT JOIN doctors doc ON LOWER(doc.department) = LOWER(d.name)
         GROUP BY d.id
         ORDER BY d.id ASC`
      )
      .all();
    res.json({ departments });
  });

  router.get('/departments/:id', (req, res) => {
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(Number(req.params.id));
    if (!dept) {
      return res.status(404).json({ error: 'Department not found.' });
    }
    const doctors = db
      .prepare('SELECT * FROM doctors WHERE LOWER(department) = LOWER(?) ORDER BY id ASC')
      .all(dept.name);
    return res.json({ department: dept, doctors });
  });

  router.get('/doctors', (req, res) => {
    const search = String(req.query.search || '').trim().toLowerCase();
    const department = String(req.query.department || '').trim();

    let doctors = db.prepare('SELECT * FROM doctors ORDER BY id ASC').all();
    if (department) {
      doctors = doctors.filter((d) => d.department.toLowerCase() === department.toLowerCase());
    }
    if (search) {
      doctors = doctors.filter((d) =>
        `${d.name} ${d.department} ${d.qualification}`.toLowerCase().includes(search)
      );
    }
    res.json({ doctors });
  });

  router.post('/contact', (req, res) => {
    const { name, email, message } = req.body || {};
    if (!name || String(name).trim().length < 3) {
      return res.status(400).json({ error: 'Name must be at least 3 characters.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!message || String(message).trim().length < 10) {
      return res.status(400).json({ error: 'Message must be at least 10 characters.' });
    }

    const createdAt = new Date().toISOString();
    const result = db
      .prepare('INSERT INTO contact_messages (name, email, message, created_at) VALUES (?, ?, ?, ?)')
      .run(String(name).trim(), String(email).trim().toLowerCase(), String(message).trim(), createdAt);

    res.status(201).json({
      id: Number(result.lastInsertRowid),
      message: 'Message received. We will reply within one working day.',
    });
  });

  return router;
}
