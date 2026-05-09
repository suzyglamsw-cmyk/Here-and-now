import React, { createContext, useContext, useState, useEffect } from 'react';
import { secureGet, secureSet, secureDelete } from '../utils/secureStorage';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load stored auth on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await secureGet('authToken');
      if (storedToken) {
        setToken(storedToken);
        // Fetch user data
        const response = await authAPI.me();
        setUser(response.data);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Error loading auth:', error);
      // Clear invalid token
      try { await secureDelete('authToken'); } catch (e) { /* ignore */ }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      // Backend returns either { token, ...flatUser } or { token, user: {...} }.
      // Either way, the login response is *partial* (missing show_as, profile_complete,
      // presence_note, etc.). We immediately re-fetch via /api/auth/me to get the
      // complete user object so AppNavigator can route correctly.
      const { token: newToken } = response.data;

      await secureSet('authToken', newToken);
      setToken(newToken);

      try {
        // Pass the token explicitly to avoid any race condition with AsyncStorage on web.
        const meRes = await authAPI.me({ headers: { Authorization: `Bearer ${newToken}` } });
        console.log('[AuthContext.login] /me show_as=', meRes.data?.show_as, 'profile_complete=', meRes.data?.profile_complete);
        setUser(meRes.data);
      } catch (meErr) {
        console.log('[AuthContext.login] /me FAILED', meErr?.message);
        // Fall back to whatever login returned if /me fails for any reason.
        const { user: nestedUser, ...flatUser } = response.data;
        // eslint-disable-next-line no-unused-vars
        const { token: _t, ...rest } = flatUser;
        setUser(nestedUser || rest);
      }

      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      return { success: false, error: message };
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      const { token: newToken } = response.data;

      await secureSet('authToken', newToken);
      setToken(newToken);

      try {
        const meRes = await authAPI.me({ headers: { Authorization: `Bearer ${newToken}` } });
        setUser(meRes.data);
      } catch (meErr) {
        const { user: nestedUser, ...flatUser } = response.data;
        // eslint-disable-next-line no-unused-vars
        const { token: _t, ...rest } = flatUser;
        setUser(nestedUser || rest);
      }

      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try { await secureDelete('authToken'); } catch (e) { /* ignore */ }
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const fetchUser = async () => {
    try {
      const response = await authAPI.me();
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.log('Error fetching user:', error);
      return null;
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    fetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
