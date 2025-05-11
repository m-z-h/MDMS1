import { createContext, useState, useEffect } from 'react';
import { login, logout, getCurrentUser } from '../api/auth';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const loginUser = async (credentials) => {
    const { user } = await login(credentials);
    setUser(user);
    return user;
  };

  const logoutUser = async () => {
    await logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}