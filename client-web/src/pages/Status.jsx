import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useToastStore } from '../context/useToastStore';
import { handleApiError } from '../utils/apiUtils';
import { buildApiUrl, WS_URL } from '../config/env';

const Status = () => {
  const toast = useToastStore();
  const [shopStatus, setShopStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch initial status
    fetchShopStatus();

    // Connect to WebSocket for live status updates
    const socketConnection = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketConnection.on('connect', () => {
      console.log('Connected to WebSocket');
      socketConnection.emit('request:shopStatus');
    });

    socketConnection.on('connect_error', (err) => {
      console.warn('WebSocket connection error:', err?.message || err);
    });

    socketConnection.on('shopStatus:current', (status) => {
      setShopStatus(status);
      setLastUpdate(new Date().toLocaleTimeString());
      setLoading(false);
    });

    socketConnection.on('shopStatus:updated', (status) => {
      setShopStatus(status);
      setLastUpdate(new Date().toLocaleTimeString());
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const fetchShopStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(buildApiUrl('/shop/status'));
      
      // Check response.ok BEFORE parsing JSON
      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[Status] [fetchShopStatus] JSON parse error:', parseError);
          setError('Server response error. Please try again.');
          return;
        }
        throw { response: { status: response.status, data } };
      }
      
      const data = await response.json();
      if (data.success) {
        setShopStatus(data.data);
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        throw new Error(data.message || 'Failed to load status');
      }
    } catch (error) {
      console.error('[Status] [fetchShopStatus] Error:', error.message || error);
      setError(error.message || 'Failed to load status. Please try again.');
      // Note: handleApiError shows duplicate toast, avoid using it here for fetch errors
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wood-100 via-primary-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🏪</div>
          <div className="text-2xl text-wood-700">Loading status...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wood-100 via-primary-50 to-amber-50">
        <div className="text-center max-w-md p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-wood-900 mb-2">Oops!</h2>
          <p className="text-wood-600 mb-6">{error}</p>
          <button
            onClick={fetchShopStatus}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-b from-primary-50 via-wood-50 to-amber-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 text-wood-900">Shop Status</h1>
          <p className="text-xl text-wood-700">Real-time updates • Live sync enabled</p>
        </motion.div>

        {/* Live Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft p-4 mb-8 flex items-center justify-center gap-3 border border-primary-100"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-3 h-3 bg-primary-500 rounded-full shadow-warm"
          />
          <span className="text-wood-700 font-medium">Live Connection Active</span>
          {lastUpdate && (
            <span className="text-sm text-gray-400">• Updated at {lastUpdate}</span>
          )}
        </motion.div>

        {/* Status Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={shopStatus?.isOpen ? 'open' : 'closed'}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className={`rounded-2xl shadow-2xl p-12 mb-8 ${
              shopStatus?.isOpen
                ? 'bg-gradient-to-br from-green-400 to-green-600'
                : 'bg-gradient-to-br from-red-400 to-red-600'
            }`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="text-center text-white"
            >
              <div className="text-8xl mb-6">
                {shopStatus?.isOpen ? '🟢' : '🔴'}
              </div>
              <h2 className="text-5xl font-bold mb-4">
                {shopStatus?.isOpen ? 'WE ARE OPEN!' : 'CURRENTLY CLOSED'}
              </h2>
              {shopStatus?.message && (
                <p className="text-2xl opacity-90">{shopStatus.message}</p>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Hours Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft p-8 mb-8 border border-primary-100"
        >
          <h3 className="text-2xl font-bold mb-6 text-wood-900">Regular Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Opening Time</span>
                <span className="text-primary-600 font-bold text-lg">
                  {shopStatus?.openingTime || '9:00 AM'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="font-medium text-gray-700">Closing Time</span>
                <span className="text-primary-600 font-bold text-lg">
                  {shopStatus?.closingTime || '6:00 PM'}
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Days Open</h4>
              <div className="flex flex-wrap gap-2">
                {(shopStatus?.daysOpen || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).map((day) => (
                  <span
                    key={day}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-3">🍵</div>
            <h4 className="font-semibold text-gray-900 mb-2">Fresh Daily</h4>
            <p className="text-sm text-gray-600">New tea selections every day</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h4 className="font-semibold text-gray-900 mb-2">Real-Time</h4>
            <p className="text-sm text-gray-600">Status updates instantly</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-3">📱</div>
            <h4 className="font-semibold text-gray-900 mb-2">Stay Connected</h4>
            <p className="text-sm text-gray-600">Always know when we're open</p>
          </div>
        </motion.div>

        {/* Last Updated */}
        {shopStatus?.lastUpdated && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-gray-500 text-sm mt-8"
          >
            Status last updated: {new Date(shopStatus.lastUpdated).toLocaleString()}
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default Status;
