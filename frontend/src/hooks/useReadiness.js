// frontend/src/hooks/useReadiness.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const useReadiness = () => {
  const { user } = useAuth();
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReadiness = useCallback(async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const res = await axios.get('/api/investlab/readiness', {
        headers: { Authorization: `Bearer ${user.token}` },
        withCredentials: true
      });
      setReadiness(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchReadiness();
  }, [fetchReadiness]);

  return { readiness, loading, error, refreshReadiness: fetchReadiness };
};
