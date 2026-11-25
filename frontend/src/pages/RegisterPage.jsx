import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.name.trim().length < 3) {
      return showToast('Full name must be at least 3 characters.', 'danger');
    }
    if (!form.email.includes('@')) {
      return showToast('Please enter a valid email address.', 'danger');
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      return showToast('Phone number must be 10 digits.', 'danger');
    }
    if (!form.dob || !form.gender) {
      return showToast('Date of birth and gender are required.', 'danger');
    }
    if (!/^(?=.*\d).{8,}$/.test(form.password)) {
      return showToast('Password must be 8+ characters and include a number.', 'danger');
    }
    if (form.password !== form.confirmPassword) {
      return showToast('Passwords do not match.', 'danger');
    }

    setSubmitting(true);
    try {
      const res = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dob: form.dob,
        gender: form.gender,
        password: form.password,
      });
      showToast(`Registered! Your patient ID is ${res.user.id}`);
      navigate('/login');
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap px-3 fade-in" style={{ maxWidth: 620 }}>
      <form className="panel row g-3" onSubmit={handleSubmit} noValidate>
        <h2>Create your account</h2>
        <div className="col-12">
          <input
            className="form-control"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <input
            className="form-control"
            placeholder="Phone (10 digits)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <input
            type="date"
            className="form-control"
            max={today}
            value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <select
            className="form-select"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            required
          >
            <option value="">Gender</option>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </select>
        </div>
        <div className="col-md-6">
          <input
            type="password"
            className="form-control"
            placeholder="Password (8+ chars, with a number)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <input
            type="password"
            className="form-control"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />
        </div>
        <div className="col-12">
          <button className="btn btn-blue w-100" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Register'}
          </button>
        </div>
        <p className="text-center m-0">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
