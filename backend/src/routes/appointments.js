import { Router } from 'express';
import { TIME_SLOTS } from '../config.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

export function createAppointmentsRouter(db) {
  const router = Router();

  router.get('/slots', (req, res) => {
    const doctorId = Number(req.query.doctorId);
    const date = String(req.query.date || '').trim();

    if (!doctorId || !date) {
      return res.status(400).json({ error: 'doctorId and date are required.' });
    }

    const rows = db
      .prepare(
        `SELECT time FROM appointments
         WHERE doctor_id = ? AND date = ? AND status != 'Cancelled'`
      )
      .all(doctorId, date);

    const booked = rows.map((r) => r.time);
    return res.json({ slots: TIME_SLOTS, booked });
  });

  router.post('/', optionalAuth, (req, res) => {
    const { name, email, phone, doctorId, date, time, reason } = req.body || {};

    if (!name || String(name).trim().length < 3) {
      return res.status(400).json({ error: 'Full name must be at least 3 characters.' });
    }
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!/^\d{10}$/.test(String(phone || '').trim())) {
      return res.status(400).json({ error: 'Phone number must be 10 digits.' });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date).trim())) {
      return res.status(400).json({ error: 'Please select a valid appointment date.' });
    }
    if (!TIME_SLOTS.includes(time)) {
      return res.status(400).json({ error: 'Please select a valid time slot.' });
    }
    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({ error: 'Please describe your symptoms or reason (at least 5 characters).' });
    }

    const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(Number(doctorId));
    if (!doctor) {
      return res.status(404).json({ error: 'Selected doctor was not found.' });
    }

    const conflict = db
      .prepare(
        `SELECT id FROM appointments
         WHERE doctor_id = ? AND date = ? AND time = ? AND status != 'Cancelled'`
      )
      .get(doctor.id, String(date).trim(), time);

    if (conflict) {
      return res.status(409).json({ error: 'That time slot has just been booked. Please pick another.' });
    }

    let patientId = req.user?.role === 'patient' ? req.user.id : null;
    if (!patientId) {
      const matchedUser = db
        .prepare("SELECT id FROM users WHERE LOWER(email) = ? AND role = 'patient'")
        .get(cleanEmail);
      if (matchedUser) {
        patientId = matchedUser.id;
      }
    }

    const id = `AP${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 89)}`;
    const createdAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO appointments
       (id, patient_id, patient_name, patient_email, patient_phone, doctor_id, doctor_name, department, date, time, reason, status, fee, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`
    ).run(
      id,
      patientId,
      String(name).trim(),
      cleanEmail,
      String(phone).trim(),
      doctor.id,
      doctor.name,
      doctor.department,
      String(date).trim(),
      time,
      String(reason).trim(),
      doctor.fee,
      createdAt
    );

    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    return res.status(201).json({ appointment });
  });

  router.patch('/:id/cancel', authenticate, (req, res) => {
    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const isOwner =
      appt.patient_id === req.user.id ||
      appt.patient_email.toLowerCase() === req.user.email.toLowerCase();

    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ error: 'You cannot modify another patient’s appointment.' });
    }

    if (appt.status === 'Completed' || appt.status === 'Cancelled') {
      return res.status(400).json({ error: `Cannot cancel an appointment that is already ${appt.status.toLowerCase()}.` });
    }

    db.prepare("UPDATE appointments SET status = 'Cancelled' WHERE id = ?").run(appt.id);
    const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appt.id);
    return res.json({ appointment: updated });
  });

  return router;
}
