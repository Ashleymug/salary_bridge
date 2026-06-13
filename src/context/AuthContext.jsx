/**
 * AuthProvider — manages JWT-based authentication state.
 *
 * On mount it checks localStorage for a saved token and calls /auth/me
 * to restore the session without requiring the user to log in again.
 *
 * login(token, user)  — called after a successful /auth/login or /auth/register
 * logout()            — clears the token and resets state
 * refreshUser()       — re-fetches /auth/me and updates in-memory user (e.g. after 2FA toggle)
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from './auth-context.js';
import { TOKEN_KEY } from '../api/client.js';
import { getMe } from '../api/auth.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    getMe()
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => {
    return getMe().then((res) => setUser(res.data));
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout, refreshUser }),
    [user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
