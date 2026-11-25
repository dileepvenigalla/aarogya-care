import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const TABS = [
  ['overview', 'fa-chart-pie', 'Overview'],
  ['docs', 'fa-user-doctor', 'Doctors'],
  ['pats', 'fa-users', 'Patients'],
  ['deps', 'fa-hospital', 'Departments'],
  ['apps', 'fa-calendar-check', 'Appointments'],
  ['msgs', 'fa-envelope', 'Messages'],
];

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [messages, setMessages] = useState([]);

  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docForm, setDocForm] = useState({
    name: '',
    department: '',
    qualification: 'MBBS, MD',
    experience: '5',
    days: 'Mon–Fri',
    fee: '600',
  });

  const [showAddDept, setShowAddDept] = useState(false);
  const [deptForm, setDeptForm] = useState({
    name: '',
    description: '',
    icon: 'fa-notes-medical',
  });

  const loadAll = useCallback(() => {
    Promise.all([
      apiFetch('/api/admin/overview'),
      apiFetch('/api/admin/doctors'),
      apiFetch('/api/admin/patients'),
      apiFetch('/api/admin/departments'),
      apiFetch('/api/admin/appointments'),
      apiFetch('/api/admin/messages'),
    ])
      .then(([ov, dc, pt, dp, ap, mg]) => {
        setOverview(ov);
        setDoctors(dc.doctors || []);
        setPatients(pt.patients || []);
        setDepartments(dp.departments || []);
        setAppointments(ap.appointments || []);
        setMessages(mg.messages || []);
      })
      .catch((err) => showToast(err.message, 'danger'));
  }, [showToast]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAll();
    }
  }, [user, loadAll]);

  async function handleAddDoctor(event) {
    event.preventDefault();
    try {
      await apiFetch('/api/admin/doctors', {
        method: 'POST',
        body: JSON.stringify({
          ...docForm,
          experience: Number(docForm.experience),
          fee: Number(docForm.fee),
        }),
      });
      showToast('Doctor added.');
      setShowAddDoc(false);
      setDocForm({
        name: '',
        department: '',
        qualification: 'MBBS, MD',
        experience: '5',
        days: 'Mon–Fri',
        fee: '600',
      });
      loadAll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function handleAddDepartment(event) {
    event.preventDefault();
    try {
      await apiFetch('/api/admin/departments', {
        method: 'POST',
        body: JSON.stringify(deptForm),
      });
      showToast('Department added.');
      setShowAddDept(false);
      setDeptForm({ name: '', description: '', icon: 'fa-notes-medical' });
      loadAll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function handleDelete(resource, id) {
    if (!window.confirm('Delete this item?')) return;
    try {
      await apiFetch(`/api/admin/${resource}/${id}`, { method: 'DELETE' });
      showToast('Deleted.');
      loadAll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await apiFetch(`/api/admin/appointments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast(`Status updated to ${status}.`);
      loadAll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  if (authLoading) return <div className="container py-5 text-mut">Checking session...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  const barData = {
    labels: (overview?.byDepartment || []).map((item) => item.department.slice(0, 6)),
    datasets: [
      {
        data: (overview?.byDepartment || []).map((item) => item.count),
        backgroundColor: '#2f6fed',
        borderRadius: 8,
      },
    ],
  };

  const doughnutData = {
    labels: (overview?.byStatus || []).map((item) => item.status),
    datasets: [
      {
        data: (overview?.byStatus || []).map((item) => item.count),
        backgroundColor: ['#ffc107', '#2f6fed', '#12a36b', '#6c757d'],
      },
    ],
  };

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
          {tab === 'overview' && (
            <>
              <div className="row g-3 mb-3">
                {[
                  [overview?.counts?.patients ?? patients.length, 'Total patients'],
                  [overview?.counts?.doctors ?? doctors.length, 'Total doctors'],
                  [overview?.counts?.appointments ?? appointments.length, 'Appointments'],
                  [overview?.counts?.departments ?? departments.length, 'Departments'],
                ].map(([count, label]) => (
                  <div className="col-6 col-lg-3" key={label}>
                    <div className="stat">
                      <b>{count}</b>
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="row g-3 mb-3">
                <div className="col-lg-7">
                  <div className="panel">
                    <h4>Appointments by department</h4>
                    <Bar
                      data={barData}
                      options={{
                        plugins: { legend: { display: false } },
                        responsive: true,
                      }}
                    />
                  </div>
                </div>
                <div className="col-lg-5">
                  <div className="panel">
                    <h4>Status</h4>
                    <Doughnut data={doughnutData} options={{ responsive: true }} />
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-lg-6">
                  <div className="panel">
                    <h4>Recent registrations</h4>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(overview?.recentRegistrations || []).map((u) => (
                            <tr key={u.id}>
                              <td>{u.id}</td>
                              <td>{u.name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="panel">
                    <h4>Recent appointments</h4>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Patient</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(overview?.recentAppointments || []).map((a) => (
                            <tr key={a.id}>
                              <td>{a.patient_name}</td>
                              <td>{a.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'docs' && (
            <div className="panel">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="m-0">Manage doctors</h4>
                <button
                  type="button"
                  className="btn btn-blue btn-sm"
                  onClick={() => setShowAddDoc((prev) => !prev)}
                >
                  {showAddDoc ? 'Close' : 'Add doctor'}
                </button>
              </div>

              {showAddDoc && (
                <form className="row g-2 mb-4 p-3 bg-light rounded-4" onSubmit={handleAddDoctor}>
                  <div className="col-md-4">
                    <input
                      className="form-control"
                      placeholder="Doctor name"
                      value={docForm.name}
                      onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={docForm.department}
                      onChange={(e) => setDocForm({ ...docForm, department: e.target.value })}
                      required
                    >
                      <option value="">Select department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Fee (₹)"
                      value={docForm.fee}
                      onChange={(e) => setDocForm({ ...docForm, fee: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      className="form-control"
                      placeholder="Qualification"
                      value={docForm.qualification}
                      onChange={(e) => setDocForm({ ...docForm, qualification: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      className="form-control"
                      placeholder="Days (e.g. Mon–Fri)"
                      value={docForm.days}
                      onChange={(e) => setDocForm({ ...docForm, days: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4 d-flex gap-2">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Years exp."
                      value={docForm.experience}
                      onChange={(e) => setDocForm({ ...docForm, experience: e.target.value })}
                    />
                    <button type="submit" className="btn btn-blue btn-sm">
                      Save
                    </button>
                  </div>
                </form>
              )}

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Fee</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.name}</td>
                        <td>{doc.department}</td>
                        <td>₹{doc.fee}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-line"
                            onClick={() => handleDelete('doctors', doc.id)}
                            aria-label="Delete"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'pats' && (
            <div className="panel">
              <h4>Manage patients</h4>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Joined</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((pt) => (
                      <tr key={pt.id}>
                        <td>{pt.id}</td>
                        <td>{pt.name}</td>
                        <td>{pt.email}</td>
                        <td>{pt.created_at}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-line"
                            onClick={() => handleDelete('patients', pt.id)}
                            aria-label="Delete"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'deps' && (
            <div className="panel">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="m-0">Manage departments</h4>
                <button
                  type="button"
                  className="btn btn-blue btn-sm"
                  onClick={() => setShowAddDept((prev) => !prev)}
                >
                  {showAddDept ? 'Close' : 'Add department'}
                </button>
              </div>

              {showAddDept && (
                <form
                  className="row g-2 mb-4 p-3 bg-light rounded-4"
                  onSubmit={handleAddDepartment}
                >
                  <div className="col-md-4">
                    <input
                      className="form-control"
                      placeholder="Department name"
                      value={deptForm.name}
                      onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      className="form-control"
                      placeholder="Short description"
                      value={deptForm.description}
                      onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-2 d-grid">
                    <button type="submit" className="btn btn-blue btn-sm">
                      Save
                    </button>
                  </div>
                </form>
              )}

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>About</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept) => (
                      <tr key={dept.id}>
                        <td>{dept.name}</td>
                        <td>{dept.description}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-line"
                            onClick={() => handleDelete('departments', dept.id)}
                            aria-label="Delete"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'apps' && (
            <div className="panel">
              <h4>Manage appointments</h4>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>When</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <tr key={appt.id}>
                        <td>{appt.id}</td>
                        <td>{appt.patient_name}</td>
                        <td>{appt.doctor_name}</td>
                        <td>
                          {appt.date} {appt.time}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <StatusBadge status={appt.status} />
                            <select
                              className="form-select form-select-sm"
                              value={appt.status}
                              onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-line"
                            onClick={() => handleDelete('appointments', appt.id)}
                            aria-label="Delete"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'msgs' && (
            <div className="panel">
              <h4>Contact inquiries</h4>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Message</th>
                      <th>Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.length > 0 ? (
                      messages.map((msg) => (
                        <tr key={msg.id}>
                          <td>{msg.name}</td>
                          <td>{msg.email}</td>
                          <td>{msg.message}</td>
                          <td>{msg.created_at.slice(0, 10)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-mut">
                          No contact messages yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
