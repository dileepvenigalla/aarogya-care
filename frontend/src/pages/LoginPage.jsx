import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      return showToast('Please enter your ID/email and password.', 'danger');
    }

    setSubmitting(true);
    try {
      const user = await login(identifier.trim(), password, rememberMe);
      showToast(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'admin' ? '/admin' : '/patient');
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap px-3 fade-in">
      <form className="panel" onSubmit={handleSubmit} noValidate>
        <h2>Patient &amp; Staff Login</h2>
        <div className="text-mut small mb-3">
          <div>Admin demo: admin@aarogya.demo / Admin@123</div>
          <div>Patient demo: patient@aarogya.demo / Patient@123</div>
        </div>

        <div className="mb-3">
          <input
            className="form-control"
            placeholder="Email or patient ID"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <label className="d-flex align-items-center gap-2">
            <input
              type="checkbox"
              className="form-check-input m-0"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none"
            onClick={() => showToast('Demo: a reset link would be emailed here.', 'info')}
          >
            Forgot password?
          </button>
        </div>
        <button className="btn btn-blue w-100" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Login'}
        </button>

        <div className="d-flex gap-2 mt-3">
          <button
            type="button"
            className="btn btn-line btn-sm flex-fill"
            onClick={() => {
              setIdentifier('patient@aarogya.demo');
              setPassword('Patient@123');
            }}
          >
            Fill Patient Demo
          </button>
          <button
            type="button"
            className="btn btn-line btn-sm flex-fill"
            onClick={() => {
              setIdentifier('admin@aarogya.demo');
              setPassword('Admin@123');
            }}
          >
            Fill Admin Demo
          </button>
        </div>

        <p className="text-center mt-3 mb-0">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
