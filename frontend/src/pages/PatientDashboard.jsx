import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DoctorCard from '../components/DoctorCard';
import StatusBadge from '../components/StatusBadge';

const TABS = [
  ['overview', 'fa-house', 'Overview'],
  ['appts', 'fa-calendar-check', 'Appointments'],
  ['doctor', 'fa-user-doctor', 'My doctors'],
  ['records', 'fa-file-medical', 'Records'],
  ['rx', 'fa-prescription-bottle-medical', 'Prescriptions'],
  ['bill', 'fa-receipt', 'Billing'],
  ['notes', 'fa-bell', 'Notifications'],
];

export default function PatientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(() => {
    setLoading(true);
    apiFetch('/api/patient/dashboard')
      .then((res) => setData(res))
      .catch((err) => showToast(err.message, 'danger'))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    if (user && user.role === 'patient') {
      loadDashboard();
    }
  }, [user, loadDashboard]);

  async function handleCancel(id) {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await apiFetch(`/api/appointments/${id}/cancel`, { method: 'PATCH' });
      showToast('Appointment cancelled.', 'info');
      loadDashboard();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  if (authLoading) return <div className="container py-5 text-mut">Checking session...</div>;
  if (!user || user.role !== 'patient') return <Navigate to="/login" replace />;

  const profile = data?.profile || user;
  const appointments = data?.appointments || [];
  const upcoming = appointments.filter((a) => a.status === 'Pending' || a.status === 'Confirmed');

  return (
    <div className="container fade-in">
      <div className="dash">
        <div className="side">
          {TABS.map(([key, icon, label]) => (
            <button
              key={key}
              type="button"
              className={tab === key ? 'on' : ''}
              onClick={() => setTab(key)}
            >
              <i className={`fa-solid ${icon} me-2`} />
              {label}
            </button>
          ))}
        </div>

        <div>
          {loading && !data ? (
            <div className="panel text-mut">Loading your dashboard...</div>
          ) : (
            <>
              {tab === 'overview' && (
                <>
                  <div className="panel mb-3">
                    <h3>Welcome, {profile.name.split(' ')[0]}!</h3>
                    <p className="text-mut mb-0">
                      Patient ID {profile.id} · {profile.email} · {profile.phone} · {profile.gender}{' '}
                      · Born {profile.dob}
                    </p>
                  </div>
                  <div className="panel">
                    <h4>Upcoming appointments</h4>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>When</th>
                            <th>Doctor</th>
                            <th>Status</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {upcoming.length > 0 ? (
                            upcoming.map((appt) => (
                              <tr key={appt.id}>
                                <td>
                                  {appt.date}
                                  <br />
                                  <small>{appt.time}</small>
                                </td>
                                <td>
                                  {appt.doctor_name}
                                  <br />
                                  <small>{appt.department}</small>
                                </td>
                                <td>
                                  <StatusBadge status={appt.status} />
                                </td>
                                <td className="text-end">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-line"
                                    onClick={() => handleCancel(appt.id)}
                                  >
                                    Cancel
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="text-mut">
                                Nothing here yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Link to="/book" className="btn btn-blue btn-sm">
                      Book new
                    </Link>
                  </div>
                </>
              )}

              {tab === 'appts' && (
                <div className="panel">
                  <h4>Appointment history</h4>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Ref</th>
                          <th>When</th>
                          <th>Doctor</th>
                          <th>Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.length > 0 ? (
                          appointments.map((appt) => (
                            <tr key={appt.id}>
                              <td>{appt.id}</td>
                              <td>
                                {appt.date}
                                <br />
                                <small>{appt.time}</small>
                              </td>
                              <td>
                                {appt.doctor_name}
                                <br />
                                <small>{appt.department}</small>
                              </td>
                              <td>
                                <StatusBadge status={appt.status} />
                              </td>
                              <td className="text-end">
                                {(appt.status === 'Pending' || appt.status === 'Confirmed') && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-line"
                                    onClick={() => handleCancel(appt.id)}
                                  >
                                    Cancel
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-mut">
                              No appointments yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === 'doctor' && (
                <div className="row g-3">
                  {(data?.doctors || []).length > 0 ? (
                    data.doctors.map((doc) => (
                      <DoctorCard key={doc.id} doctor={doc} colClass="col-md-6 col-lg-4" />
                    ))
                  ) : (
                    <div className="panel text-mut">Doctors you book will appear here.</div>
                  )}
                </div>
              )}

              {tab === 'records' && (
                <div className="panel">
                  <h4>Medical records</h4>
                  <p className="small text-mut">Sample records stored in the backend database.</p>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Record</th>
                          <th>Note</th>
                          <th>Clinician</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.records || []).length > 0 ? (
                          data.records.map((rec) => (
                            <tr key={rec.id}>
                              <td>{rec.date}</td>
                              <td>{rec.title}</td>
                              <td>{rec.note}</td>
                              <td>{rec.doctor_name}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-mut">
                              No records on file yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === 'rx' && (
                <div className="panel">
                  <h4>Prescriptions</h4>
                  <p className="small text-mut">Sample prescriptions from your visits.</p>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Dose</th>
                          <th>Duration</th>
                          <th>Prescribed by</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.prescriptions || []).length > 0 ? (
                          data.prescriptions.map((rx) => (
                            <tr key={rx.id}>
                              <td>{rx.medicine}</td>
                              <td>{rx.dose}</td>
                              <td>{rx.duration}</td>
                              <td>{rx.prescribed_by}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-mut">
                              No prescriptions on file yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === 'bill' && (
                <div className="panel">
                  <h4>Billing</h4>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Visit</th>
                          <th>Doctor</th>
                          <th>Status</th>
                          <th>Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.length > 0 ? (
                          appointments.map((appt) => (
                            <tr key={appt.id}>
                              <td>{appt.date}</td>
                              <td>{appt.doctor_name}</td>
                              <td>
                                <StatusBadge status={appt.status} />
                              </td>
                              <td>{appt.status === 'Cancelled' ? '₹0' : `₹${appt.fee}`}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-mut">
                              No billing items yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <b>Total active billing: ₹{data?.totalBilling || 0}</b>
                </div>
              )}

              {tab === 'notes' && (
                <div className="panel">
                  <h4>Notifications</h4>
                  <ul className="list-unstyled mb-0">
                    {(data?.notifications || []).length > 0 ? (
                      data.notifications.map((note) => (
                        <li className="mb-2" key={note.id}>
                          <i className="fa-solid fa-circle-info text-primary me-2" />
                          {note.message}
                        </li>
                      ))
                    ) : (
                      <li className="text-mut">No notifications.</li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
