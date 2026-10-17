import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, ApiError } from './api';

const AuthContext = createContext(null);

// status: 'loading' | 'authenticated' | 'unauthenticated' | 'error'
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch('/api/auth/me');
      setUser(data);
      setStatus('authenticated');
    } catch (err) {
      setUser(null);
      // 401/403 means "not logged in". Anything else is a connectivity/server problem.
      setStatus(err instanceof ApiError && (err.status === 401 || err.status === 403) ? 'unauthenticated' : 'error');
    }
  }, []);

  useEffect(() => {
    // refresh() only sets state after awaiting the network, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { userEmail: email, userPassword: password },
    });
    setUser(data);
    setStatus('authenticated');
    return data;
  }, []);

  const signup = useCallback(async ({ name, email, phone, password }) => {
    const data = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: { userName: name, userEmail: email, userNumber: Number(phone), userPassword: password },
    });
    setUser(data); // backend signs the new user in
    setStatus('authenticated');
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      // Clear local state even if the request failed so the UI never shows a stale session.
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, isLoggedIn: status === 'authenticated', refresh, login, signup, logout, setUser }),
    [user, status, refresh, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
