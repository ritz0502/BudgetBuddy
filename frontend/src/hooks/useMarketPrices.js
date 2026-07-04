// frontend/src/hooks/useMarketPrices.js
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const useMarketPrices = () => {
  const [prices, setPrices] = useState({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Assuming backend is on the proxy origin or same host
    const socket = io('/', {
      path: '/socket.io', // standard socket.io path
    });

    socket.on('connect', () => {
      setConnected(true);
      console.log('Socket connected for live prices');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Socket disconnected');
    });

    // Listen for initial snapshot
    socket.on('priceSnapshot', (data) => {
      console.log('--- RECEIVED priceSnapshot PAYLOAD ---', data);
      const formatted = {};
      if (data) {
        Object.keys(data).forEach(sym => {
          formatted[sym] = data[sym]?.price || 0;
        });
      }
      setPrices(formatted);
    });

    // Listen for incremental updates
    socket.on('priceUpdate', (update) => {
      console.log('--- RECEIVED priceUpdate PAYLOAD ---', update);
      if (!update || !update.data) return;
      setPrices((prev) => {
        const next = { ...prev };
        Object.keys(update.data).forEach(sym => {
          next[sym] = update.data[sym]?.price || next[sym] || 0;
        });
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { prices, connected };
};
