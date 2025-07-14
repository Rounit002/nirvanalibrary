import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>; // ✅ NEW
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
  isLoading: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ NEW FUNCTION: Refresh user session via /auth/refresh
  const refreshUser = async () => {
    try {
      const response = await axios.get('/api/auth/refresh', { withCredentials: true });
      const refreshedUser = response.data.user;
      refreshedUser.permissions = refreshedUser.permissions || [];
      setUser(refreshedUser);
      console.log('[AuthContext] Session refreshed:', refreshedUser);
    } catch (err) {
      console.error('[AuthContext] Failed to refresh session:', err);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkAuth = async () => {
      try {
        const data = await api.checkAuthStatus();
        if (data.isAuthenticated) {
          data.user.permissions = data.user.permissions || [];
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    intervalId = setInterval(checkAuth, 30000); // Recheck every 30s
    return () => clearInterval(intervalId);
  }, []);

  const login = (user: User) => {
    user.permissions = user.permissions || [];
    setUser(user);
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        logout,
        refreshUser, // ✅ Provide function to components
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
