import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

let server;
let baseUrl;
let dbRef;

before(async () => {
  const { app, db } = createApp({ dbPath: ':memory:' });
  dbRef = db;
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  dbRef.close();
});

async function api(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

describe('Aarogya Care API', () => {
  it('returns seeded departments and doctors', async () => {
    const deptRes = await api('/api/departments');
    assert.equal(deptRes.status, 200);
    assert.equal(deptRes.data.departments.length, 10);

    const docRes = await api('/api/doctors?department=Cardiology');
    assert.equal(docRes.status, 200);
    assert.equal(docRes.data.doctors.length, 1);
    assert.equal(docRes.data.doctors[0].name, 'Dr. Ananya Reddy');
  });

  it('registers a patient, logs in, books a slot, and blocks double booking', async () => {
    const reg = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Priya Menon',
        email: 'priya@example.com',
        phone: '9876501234',
        dob: '1995-08-20',
        gender: 'Female',
        password: 'Password1',
      }),
    });
    assert.equal(reg.status, 201);
    assert.ok(reg.data.token);
    assert.match(reg.data.user.id, /^PT\d+$/);

    const login = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: reg.data.user.id,
        password: 'Password1',
      }),
    });
    assert.equal(login.status, 200);
    const token = login.data.token;

    const booking = await api('/api/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'Priya Menon',
        email: 'priya@example.com',
        phone: '9876501234',
        doctorId: 1,
        date: '2026-12-10',
        time: '10:30 AM',
        reason: 'Routine heart checkup',
      }),
    });
    assert.equal(booking.status, 201);
    assert.equal(booking.data.appointment.status, 'Pending');

    const conflict = await api('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Other Person',
        email: 'other@example.com',
        phone: '9876509999',
        doctorId: 1,
        date: '2026-12-10',
        time: '10:30 AM',
        reason: 'Chest discomfort',
      }),
    });
    assert.equal(conflict.status, 409);

    const dash = await api('/api/patient/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(dash.status, 200);
    assert.equal(dash.data.appointments.length, 1);
    assert.equal(dash.data.totalBilling, 900);
  });

  it('enforces admin authorization and supports admin CRUD', async () => {
    const unauth = await api('/api/admin/overview');
    assert.equal(unauth.status, 401);

    const patientLogin = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: 'patient@aarogya.demo',
        password: 'Patient@123',
      }),
    });
    const forbidden = await api('/api/admin/overview', {
      headers: { Authorization: `Bearer ${patientLogin.data.token}` },
    });
    assert.equal(forbidden.status, 403);

    const adminLogin = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: 'admin@aarogya.demo',
        password: 'Admin@123',
      }),
    });
    assert.equal(adminLogin.status, 200);
    const adminToken = adminLogin.data.token;

    const addDoc = await api('/api/admin/doctors', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Dr. Kavita Rao',
        department: 'Cardiology',
        qualification: 'MD, DM',
        experience: 12,
        days: 'Mon–Fri',
        fee: 950,
      }),
    });
    assert.equal(addDoc.status, 201);

    const delDoc = await api(`/api/admin/doctors/${addDoc.data.doctor.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delDoc.status, 200);
  });
});
