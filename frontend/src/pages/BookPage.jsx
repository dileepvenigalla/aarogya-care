import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function BookPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [date, setDate] = useState('');
  const [department, setDepartment] = useState(searchParams.get('dept') || '');
  const [doctorId, setDoctorId] = useState(searchParams.get('doc') || '');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.all([apiFetch('/api/departments'), apiFetch('/api/doctors')])
      .then(([deptRes, docRes]) => {
        const deptList = deptRes.departments || [];
        const docList = docRes.doctors || [];
        setDepartments(deptList);
        setDoctors(docList);

        const preDocId = searchParams.get('doc');
        if (preDocId) {
          const matched = docList.find((d) => String(d.id) === String(preDocId));
          if (matched) {
            setDepartment(matched.department);
            setDoctorId(String(matched.id));
          }
        }
      })
      .catch((err) => showToast(err.message, 'danger'));
  }, [searchParams, showToast]);

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name || '');
      setEmail((prev) => prev || user.email || '');
      setPhone((prev) => prev || user.phone || '');
    }
  }, [user]);

  const deptDoctors = useMemo(
    () => doctors.filter((d) => !department || d.department === department),
    [doctors, department]
  );

  useEffect(() => {
    setSelectedTime('');
    if (!doctorId || !date) {
      setSlots([]);
      setBookedSlots([]);
      return;
    }

    apiFetch(`/api/appointments/slots?doctorId=${doctorId}&date=${encodeURIComponent(date)}`)
      .then((res) => {
        setSlots(res.slots || []);
        setBookedSlots(res.booked || []);
      })
      .catch(() => {
        setSlots([]);
        setBookedSlots([]);
      });
  }, [doctorId, date]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (name.trim().length < 3) {
      return showToast('Please enter your full name.', 'danger');
    }
    if (!email.includes('@')) {
      return showToast('Please enter a valid email address.', 'danger');
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      return showToast('Phone number must be 10 digits.', 'danger');
    }
    if (!date || !department || !doctorId) {
      return showToast('Please select a date, department, and doctor.', 'danger');
    }
    if (!selectedTime) {
      return showToast('Please choose an available time slot.', 'danger');
    }
    if (reason.trim().length < 5) {
      return showToast('Please describe your symptoms or reason for visit.', 'danger');
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          doctorId: Number(doctorId),
          date,
          time: selectedTime,
          reason: reason.trim(),
        }),
      });
      setConfirmed(res.appointment);
      showToast('Appointment submitted.');
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="sec fade-in">
      <div className="container" style={{ maxWidth: 820 }}>
        <h2>Book an appointment</h2>
        <p className="text-mut">
          Takes about a minute. Demo only: do not enter real medical details.
        </p>

        {confirmed ? (
          <div className="panel text-center">
            <div
              className="ico mx-auto mb-3"
              style={{ background: '#dcf7ea', color: '#12a36b' }}
            >
              <i className="fa-solid fa-check" />
            </div>
            <h2>Appointment requested</h2>
            <p className="text-mut">
              Reference <b>{confirmed.id}</b>: {confirmed.doctor_name} on {confirmed.date} at{' '}
              {confirmed.time}. Status: {confirmed.status}.
            </p>
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              <Link
                to={user ? (user.role === 'admin' ? '/admin' : '/patient') : '/'}
                className="btn btn-blue"
              >
                {user ? 'Go to my dashboard' : 'Back to home'}
              </Link>
              <button
                type="button"
                className="btn btn-line"
                onClick={() => {
                  setConfirmed(null);
                  setSelectedTime('');
                  setReason('');
                }}
              >
                Book another
              </button>
            </div>
          </div>
        ) : (
          <form className="panel row g-3" onSubmit={handleSubmit} noValidate>
            <div className="col-md-6">
              <input
                className="form-control"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <input
                className="form-control"
                placeholder="Phone (10 digits)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <input
                type="date"
                className="form-control"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <select
                className="form-select"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setDoctorId('');
                }}
                required
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <select
                className="form-select"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                required
              >
                <option value="">Select doctor</option>
                {deptDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} (₹{doc.fee})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <label className="fw-semibold mb-2 d-block">Available time</label>
              <div className="d-flex flex-wrap gap-2">
                {slots.length > 0 ? (
                  slots.map((slot) => {
                    const taken = bookedSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        className={`slot ${selectedTime === slot ? 'on' : ''}`}
                        disabled={taken}
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-mut small">
                    Choose a doctor and date to see available times.
                  </span>
                )}
              </div>
            </div>
            <div className="col-12">
              <textarea
                className="form-control"
                rows={3}
                placeholder="Symptoms or reason for visit"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <div className="col-12">
              <button className="btn btn-blue btn-lg" type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit appointment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
