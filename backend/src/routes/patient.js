import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

export function createPatientRouter(db) {
  const router = Router();

  router.use(authenticate);

  router.get('/dashboard', (req, res) => {
    const user = db
      .prepare('SELECT id, role, name, email, phone, dob, gender, created_at FROM users WHERE id = ?')
      .get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const appointments = db
      .prepare(
        `SELECT * FROM appointments
         WHERE patient_id = ? OR LOWER(patient_email) = LOWER(?)
         ORDER BY date DESC, id DESC`
      )
      .all(user.id, user.email);

    const doctorIds = [...new Set(appointments.map((a) => a.doctor_id).filter(Boolean))];
    const doctors = doctorIds.length
      ? db
          .prepare(`SELECT * FROM doctors WHERE id IN (${doctorIds.map(() => '?').join(',')})`)
          .all(...doctorIds)
      : [];

    const records = db
      .prepare('SELECT * FROM medical_records WHERE patient_id = ? ORDER BY date DESC, id DESC')
      .all(user.id);

    const prescriptions = db
      .prepare('SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY date DESC, id DESC')
      .all(user.id);

    const billableAppointments = appointments.filter((a) => a.status !== 'Cancelled');
    const totalBilling = billableAppointments.reduce((sum, a) => sum + Number(a.fee || 0), 0);

    const notifications = appointments.map((a) => ({
      id: a.id,
      message: `Your visit with ${a.doctor_name} on ${a.date} (${a.time}) is ${a.status.toLowerCase()}.`,
      status: a.status,
      date: a.date,
    }));

    return res.json({
      profile: user,
      appointments,
      doctors,
      records,
      prescriptions,
      totalBilling,
      notifications,
    });
  });

  return router;
}
