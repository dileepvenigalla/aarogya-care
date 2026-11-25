import { Router } from 'express';
import { APPOINTMENT_STATUSES } from '../config.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

export function createAdminRouter(db) {
  const router = Router();

  router.use(authenticate, requireAdmin);

  router.get('/overview', (_req, res) => {
    const patients = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'patient'").get().count;
    const doctors = db.prepare('SELECT COUNT(*) AS count FROM doctors').get().count;
    const appointments = db.prepare('SELECT COUNT(*) AS count FROM appointments').get().count;
    const departments = db.prepare('SELECT COUNT(*) AS count FROM departments').get().count;
    const messagesCount = db.prepare('SELECT COUNT(*) AS count FROM contact_messages').get().count;

    const allDepartments = db.prepare('SELECT name FROM departments ORDER BY id ASC').all();
    const allAppointments = db.prepare('SELECT department, status FROM appointments').all();

    const byDepartment = allDepartments.map((dept) => ({
      department: dept.name,
      count: allAppointments.filter((a) => a.department === dept.name).length,
    }));

    const byStatus = APPOINTMENT_STATUSES.map((status) => ({
      status,
      count: allAppointments.filter((a) => a.status === status).length,
    }));

    const recentRegistrations = db
      .prepare("SELECT id, name, email, created_at FROM users WHERE role = 'patient' ORDER BY rowid DESC LIMIT 5")
      .all();

    const recentAppointments = db
      .prepare('SELECT id, patient_name, doctor_name, date, status FROM appointments ORDER BY rowid DESC LIMIT 5')
      .all();

    res.json({
      counts: { patients, doctors, appointments, departments, messages: messagesCount },
      byDepartment,
      byStatus,
      recentRegistrations,
      recentAppointments,
    });
  });

  router.get('/doctors', (_req, res) => {
    const doctors = db.prepare('SELECT * FROM doctors ORDER BY id ASC').all();
    res.json({ doctors });
  });

  router.post('/doctors', (req, res) => {
    const { name, department, qualification, experience, days, fee } = req.body || {};
    if (!name || String(name).trim().length < 3) {
      return res.status(400).json({ error: 'Doctor name is required (at least 3 characters).' });
    }
    const deptRow = db
      .prepare('SELECT name FROM departments WHERE LOWER(name) = LOWER(?)')
      .get(String(department || '').trim());
    if (!deptRow) {
      return res.status(400).json({ error: 'Please choose a valid existing department.' });
    }
    const numFee = Number(fee);
    if (!Number.isFinite(numFee) || numFee <= 0) {
      return res.status(400).json({ error: 'Consultation fee must be a positive number.' });
    }

    const totalDocs = db.prepare('SELECT COUNT(*) AS count FROM doctors').get().count;
    const result = db
      .prepare(
        `INSERT INTO doctors (name, department, qualification, experience, days, fee, image_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        String(name).trim(),
        deptRow.name,
        String(qualification || 'MBBS, MD').trim(),
        Math.max(1, Number(experience) || 5),
        String(days || 'Mon–Fri').trim(),
        Math.round(numFee),
        totalDocs + 1
      );

    const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(Number(result.lastInsertRowid));
    return res.status(201).json({ doctor });
  });

  router.delete('/doctors/:id', (req, res) => {
    const id = Number(req.params.id);
    const result = db.prepare('DELETE FROM doctors WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }
    return res.json({ deleted: id });
  });

  router.get('/departments', (_req, res) => {
    const departments = db.prepare('SELECT * FROM departments ORDER BY id ASC').all();
    res.json({ departments });
  });

  router.post('/departments', (req, res) => {
    const { name, description, icon } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'Department name is required.' });
    }
    if (!description || String(description).trim().length < 5) {
      return res.status(400).json({ error: 'Short description is required.' });
    }

    const existing = db
      .prepare('SELECT id FROM departments WHERE LOWER(name) = LOWER(?)')
      .get(String(name).trim());
    if (existing) {
      return res.status(409).json({ error: 'Department already exists.' });
    }

    const totalDepts = db.prepare('SELECT COUNT(*) AS count FROM departments').get().count;
    const result = db
      .prepare('INSERT INTO departments (name, icon, description, image_index) VALUES (?, ?, ?, ?)')
      .run(
        String(name).trim(),
        String(icon || 'fa-notes-medical').trim(),
        String(description).trim(),
        totalDepts
      );

    const department = db.prepare('SELECT * FROM departments WHERE id = ?').get(Number(result.lastInsertRowid));
    return res.status(201).json({ department });
  });

  router.delete('/departments/:id', (req, res) => {
    const id = Number(req.params.id);
    const result = db.prepare('DELETE FROM departments WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Department not found.' });
    }
    return res.json({ deleted: id });
  });

  router.get('/patients', (_req, res) => {
    const patients = db
      .prepare(
        "SELECT id, name, email, phone, dob, gender, created_at FROM users WHERE role = 'patient' ORDER BY rowid DESC"
      )
      .all();
    res.json({ patients });
  });

  router.delete('/patients/:id', (req, res) => {
    const result = db
      .prepare("DELETE FROM users WHERE id = ? AND role = 'patient'")
      .run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }
    return res.json({ deleted: req.params.id });
  });

  router.get('/appointments', (_req, res) => {
    const appointments = db.prepare('SELECT * FROM appointments ORDER BY date DESC, rowid DESC').all();
    res.json({ appointments });
  });

  router.patch('/appointments/:id', (req, res) => {
    const { status } = req.body || {};
    if (!APPOINTMENT_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid appointment status.' });
    }

    const result = db
      .prepare('UPDATE appointments SET status = ? WHERE id = ?')
      .run(status, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
    return res.json({ appointment });
  });

  router.delete('/appointments/:id', (req, res) => {
    const result = db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }
    return res.json({ deleted: req.params.id });
  });

  router.get('/messages', (_req, res) => {
    const messages = db.prepare('SELECT * FROM contact_messages ORDER BY id DESC').all();
    res.json({ messages });
  });

  return router;
}
