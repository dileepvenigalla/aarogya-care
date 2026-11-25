import { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, getStoredToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem('ac_user') || localStorage.getItem('ac_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(getStoredToken()));

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    apiFetch('/api/auth/me', { token })
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        clearStorage();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function clearStorage() {
    sessionStorage.removeItem('ac_token');
    sessionStorage.removeItem('ac_user');
    localStorage.removeItem('ac_token');
    localStorage.removeItem('ac_user');
  }

  function persistSession(token, userData, rememberMe) {
    clearStorage();
    const target = rememberMe ? localStorage : sessionStorage;
    target.setItem('ac_token', token);
    target.setItem('ac_user', JSON.stringify(userData));
    setUser(userData);
  }

  async function login(identifier, password, rememberMe = false) {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    persistSession(res.token, res.user, rememberMe);
    return res.user;
  }

  async function register(formData) {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    return res;
  }

  function logout() {
    clearStorage();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
