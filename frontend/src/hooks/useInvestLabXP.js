// frontend/src/hooks/useInvestLabXP.js
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const useInvestLabXP = (onXPEvent) => {
  const [xpData, setXpData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const prevXpRef = useRef(null);
  const prevAchRef = useRef(null);

  const fetchGamificationData = useCallback(async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${user.token}` };

      const [xpRes, achRes, streakRes] = await Promise.all([
        axios.get('/api/investlab/xp', { headers, withCredentials: true }),
        axios.get('/api/investlab/achievements', { headers, withCredentials: true }),
        axios.get('/api/investlab/streak', { headers, withCredentials: true }),
      ]);

      const newXpData = xpRes.data;
      const newAchievements = achRes.data.badges;

      // Detect changes for toasts
      if (prevXpRef.current !== null && newXpData.xp > prevXpRef.current) {
        const diff = newXpData.xp - prevXpRef.current;
        if (onXPEvent) onXPEvent({ type: 'xp', message: `+${diff} XP Earned!` });
      }

      if (prevAchRef.current !== null && newAchievements.length > prevAchRef.current) {
        const newBadge = newAchievements[newAchievements.length - 1];
        if (onXPEvent) onXPEvent({ type: 'badge', message: `Achievement Unlocked: ${newBadge.name.replace(/_/g, ' ')}` });
      }

      prevXpRef.current = newXpData.xp;
      prevAchRef.current = newAchievements.length;

      setXpData(newXpData);
      setAchievements(newAchievements);
      setStreakData(streakRes.data);
    } catch (error) {
      console.error('Failed to fetch gamification data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, onXPEvent]);

  useEffect(() => {
    fetchGamificationData();
  }, [fetchGamificationData]);

  const postActivity = async (action) => {
    if (!user?.token) return null;
    try {
      const res = await axios.post('/api/investlab/activity', { action }, {
        headers: { Authorization: `Bearer ${user.token}` },
        withCredentials: true
      });
      fetchGamificationData();
      return res.data;
    } catch (error) {
      console.error('Failed to post activity:', error);
      return null;
    }
  };

  return { xpData, achievements, streakData, loading, refreshGamification: fetchGamificationData, postActivity };
};
