import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { TIME_SLOTS } from './config.js';

const SEED_DEPARTMENTS = [
  ['Cardiology', 'fa-heart-pulse', 'Heart rhythm, blood pressure and cardiac rehabilitation.'],
  ['Neurology', 'fa-brain', 'Care for migraines, stroke, epilepsy and nerve disorders.'],
  ['Orthopedics', 'fa-bone', 'Joints, fractures, sports injuries and spine care.'],
  ['Dermatology', 'fa-hand-dots', 'Skin, hair and nail conditions for every age.'],
  ['Pediatrics', 'fa-baby', 'Gentle care for infants, children and teens.'],
  ['Dentistry', 'fa-tooth', 'Check-ups, fillings, braces and oral surgery.'],
  ['Ophthalmology', 'fa-eye', 'Eye exams, cataract care and vision correction.'],
  ['General Medicine', 'fa-stethoscope', 'First point of care for everyday health concerns.'],
  ['Gynecology', 'fa-person-pregnant', 'Women’s health, pregnancy and maternity care.'],
  ['Radiology', 'fa-x-ray', 'X-ray, ultrasound, CT and MRI imaging.'],
];

const SEED_DOCTORS = [
  ['Dr. Ananya Reddy', 'Cardiology', 'MD, DM Cardiology', 14, 'Mon, Wed, Fri', 900],
  ['Dr. Rohan Mehta', 'Neurology', 'MD, DM Neurology', 11, 'Tue, Thu, Sat', 850],
  ['Dr. Kiran Naidu', 'Orthopedics', 'MS Orthopedics', 16, 'Mon, Tue, Thu', 800],
  ['Dr. Sneha Iyer', 'Dermatology', 'MD Dermatology', 9, 'Wed, Fri, Sat', 700],
  ['Dr. Arjun Varma', 'Pediatrics', 'MD Pediatrics', 12, 'Mon–Sat', 600],
  ['Dr. Meera Kapoor', 'Dentistry', 'BDS, MDS', 8, 'Mon, Wed, Sat', 500],
  ['Dr. Suresh Rao', 'Ophthalmology', 'MS Ophthalmology', 18, 'Tue, Thu, Fri', 750],
  ['Dr. Farah Khan', 'General Medicine', 'MBBS, MD', 10, 'Mon–Sat', 400],
  ['Dr. Lakshmi Prasad', 'Gynecology', 'MS OBG', 15, 'Mon, Wed, Fri', 800],
  ['Dr. Vikram Sethi', 'Radiology', 'MD Radiodiagnosis', 13, 'Tue–Sat', 650],
];

/**
 * Opens the SQLite database, initializes tables, and seeds initial demo data if empty.
 * Pass ":memory:" for isolated tests.
 */
export function initDatabase(dbPath) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('patient', 'admin')),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      phone TEXT DEFAULT '',
      dob TEXT DEFAULT '',
      gender TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      icon TEXT NOT NULL DEFAULT 'fa-notes-medical',
      description TEXT NOT NULL,
      image_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      qualification TEXT NOT NULL DEFAULT 'MBBS',
      experience INTEGER NOT NULL DEFAULT 5,
      days TEXT NOT NULL DEFAULT 'Mon–Fri',
      fee INTEGER NOT NULL,
      image_index INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      patient_name TEXT NOT NULL,
      patient_email TEXT NOT NULL,
      patient_phone TEXT NOT NULL,
      doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
      doctor_name TEXT NOT NULL,
      department TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
      fee INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      note TEXT NOT NULL,
      doctor_name TEXT DEFAULT 'Aarogya Care Lab'
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      medicine TEXT NOT NULL,
      dose TEXT NOT NULL,
      duration TEXT NOT NULL,
      prescribed_by TEXT DEFAULT 'Attending Specialist',
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  seedDatabase(db);
  return db;
}

function seedDatabase(db) {
  const deptCount = db.prepare('SELECT COUNT(*) AS count FROM departments').get().count;
  if (deptCount === 0) {
    const insertDept = db.prepare(
      'INSERT INTO departments (name, icon, description, image_index) VALUES (?, ?, ?, ?)'
    );
    SEED_DEPARTMENTS.forEach(([name, icon, description], index) => {
      insertDept.run(name, icon, description, index);
    });
  }

  const docCount = db.prepare('SELECT COUNT(*) AS count FROM doctors').get().count;
  if (docCount === 0) {
    const insertDoc = db.prepare(
      'INSERT INTO doctors (name, department, qualification, experience, days, fee, image_index) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    SEED_DOCTORS.forEach(([name, department, qualification, experience, days, fee], index) => {
      insertDoc.run(name, department, qualification, experience, days, fee, index + 1);
    });
  }

  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (!adminExists) {
    const adminHash = bcrypt.hashSync('Admin@123', 10);
    db.prepare(
      `INSERT INTO users (id, role, name, email, phone, dob, gender, password_hash, created_at)
       VALUES (?, 'admin', ?, ?, ?, ?, ?, ?, ?)`
    ).run('ADMIN01', 'Admin', 'admin@aarogya.demo', '9000000000', '1990-01-01', 'Other', adminHash, '2025-01-01');
  }

  const patientExists = db.prepare("SELECT id FROM users WHERE email = 'patient@aarogya.demo'").get();
  if (!patientExists) {
    const patientHash = bcrypt.hashSync('Patient@123', 10);
    db.prepare(
      `INSERT INTO users (id, role, name, email, phone, dob, gender, password_hash, created_at)
       VALUES (?, 'patient', ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'PT10001',
      'Aarav Sharma',
      'patient@aarogya.demo',
      '9876543210',
      '1994-05-18',
      'Male',
      patientHash,
      '2025-01-10'
    );

    db.prepare(
      'INSERT INTO medical_records (patient_id, date, title, note, doctor_name) VALUES (?, ?, ?, ?, ?)'
    ).run('PT10001', '2025-01-12', 'Complete Blood Count', 'All markers within normal reference range', 'Dr. Farah Khan');

    db.prepare(
      'INSERT INTO medical_records (patient_id, date, title, note, doctor_name) VALUES (?, ?, ?, ?, ?)'
    ).run('PT10001', '2024-11-03', 'Chest X-Ray', 'Clear lung fields, normal cardiac silhouette', 'Dr. Vikram Sethi');

    db.prepare(
      'INSERT INTO prescriptions (patient_id, medicine, dose, duration, prescribed_by, date) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('PT10001', 'Vitamin D3 2000 IU', '1 tablet daily after breakfast', '30 days', 'Dr. Farah Khan', '2025-01-12');

    db.prepare(
      'INSERT INTO prescriptions (patient_id, medicine, dose, duration, prescribed_by, date) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('PT10001', 'Paracetamol 500 mg', '1 tablet as needed for fever', '5 days', 'Dr. Farah Khan', '2025-01-12');
  }

  const apptCount = db.prepare('SELECT COUNT(*) AS count FROM appointments').get().count;
  if (apptCount === 0) {
    const docs = db.prepare('SELECT id, name, department, fee FROM doctors ORDER BY id ASC').all();
    const statuses = ['Pending', 'Confirmed', 'Completed'];
    const sampleNames = [
      'Demo Patient A',
      'Demo Patient B',
      'Demo Patient C',
      'Demo Patient D',
      'Demo Patient E',
      'Demo Patient F',
    ];
    const insertAppt = db.prepare(
      `INSERT INTO appointments
       (id, patient_id, patient_name, patient_email, patient_phone, doctor_id, doctor_name, department, date, time, reason, status, fee, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    sampleNames.forEach((patientName, idx) => {
      const doc = docs[idx % docs.length];
      const pid = idx === 0 ? 'PT10001' : null;
      const email = idx === 0 ? 'patient@aarogya.demo' : 'demo@example.com';
      const displayName = idx === 0 ? 'Aarav Sharma' : patientName;
      insertAppt.run(
        `AP10000${idx}`,
        pid,
        displayName,
        email,
        '9000000000',
        doc.id,
        doc.name,
        doc.department,
        `2025-02-${String(10 + idx).padStart(2, '0')}`,
        TIME_SLOTS[idx % TIME_SLOTS.length],
        'Sample consultation visit',
        statuses[idx % statuses.length],
        doc.fee,
        '2025-02-01T09:00:00.000Z'
      );
    });
  }
}
