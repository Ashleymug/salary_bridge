import { createContext } from 'react';

/**
 * Shape of the value provided by AuthProvider.
 * isLoading is true while the initial token-restore fetch is in flight.
 */
export const AuthContext = createContext({
  user: null,
  isLoading: true,
  login: (_token, _user) => {},
  logout: () => {},
  refreshUser: () => Promise.resolve(),
});
