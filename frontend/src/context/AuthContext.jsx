// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useLayoutEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Access token lives only in memory (never localStorage)
  const [user, setUser] = useState(null);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);
  // true while the initial /refresh call is in-flight
  const [authLoading, setAuthLoading] = useState(true);

  // ── On app load: silently restore session via refresh token cookie ──────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await axios.post(
          "/api/auth/refresh",
          {},
          { withCredentials: true }
        );
        setUser(data);
        setCompletedQuizzes(data.completedQuizzes || []);
      } catch {
        // No valid refresh token → stay logged out (this is expected)
      } finally {
        setAuthLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ── Axios Interceptor for 401 Refresh ─────────────────────────────────────────
  useLayoutEffect(() => {
    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/api/auth/refresh' && originalRequest.url !== '/api/auth/login') {
          originalRequest._retry = true;
          try {
            const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
            setUser((prev) => ({ ...prev, token: data.token }));
            // Set the new token in the retry request
            if (originalRequest.headers.Authorization) {
              originalRequest.headers.Authorization = `Bearer ${data.token}`;
            }
            return axios(originalRequest);
          } catch (refreshError) {
             setUser(null);
             return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(resInterceptor);
  }, []);

  // ── login: store access token in memory only ────────────────────────────────
  const login = (data) => {
    setUser(data);
    setCompletedQuizzes(data.completedQuizzes || []);
  };

  // ── logout: clear cookie via backend, wipe in-memory state ─────────────────
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
    } catch {
      // Ignore errors — we clear local state regardless
    }
    setUser(null);
    setCompletedQuizzes([]);
  };

  // ── updateXp: keep in-memory user in sync after quiz submission ─────────────
  const updateXp = (newXp) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, xp: newXp };
    });
  };

  // ── updateCompletedQuizzes: keep in-memory state in sync ───────────────────
  const updateCompletedQuizzes = (newList) => {
    setCompletedQuizzes(newList);
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, completedQuizzes: newList };
    });
  };

  // ── isQuizCompleted: helper for quiz dashboard ──────────────────────────────
  const isQuizCompleted = (quizId) =>
    completedQuizzes.some((c) => c.quizId?.toString() === quizId?.toString());

  return (
    <AuthContext.Provider
      value={{
        user,
        completedQuizzes,
        authLoading,
        login,
        logout,
        updateXp,
        updateCompletedQuizzes,
        isQuizCompleted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);