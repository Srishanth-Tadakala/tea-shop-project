import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import useAuthStore from '../../context/useAuthStore';
import { useToastStore } from '../../context/useToastStore';
import { handleApiError } from '../../utils/apiUtils';
import { buildApiUrl, WS_URL } from '../../config/env';

const AdminDashboard = () => {
  const { admin, logout } = useAuthStore();
  const toast = useToastStore();
  const navigate = useNavigate();
  const [shopStatus, setShopStatus] = useState(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    availableItems: 0,
    categories: 0,
  });
  const [socket, setSocket] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchDashboardData();

    // Connect to WebSocket for real-time updates
    const socketConnection = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketConnection.on('connect', () => {
      console.log('Admin dashboard connected to WebSocket');
      socketConnection.emit('join:admin');
    });

    socketConnection.on('connect_error', (err) => {
      console.warn('WebSocket connection error:', err?.message || err);
    });

    // Listen for shop status updates
    socketConnection.on('shopStatus:updated', (status) => {
      setShopStatus(status);
      setLastUpdate(new Date().toLocaleTimeString());
    });

    // Listen for tea item changes to update stats
    socketConnection.on('teaItem:created', () => {
      fetchDashboardData();
    });

    socketConnection.on('teaItem:updated', () => {
      fetchDashboardData();
    });

    socketConnection.on('teaItem:deleted', () => {
      fetchDashboardData();
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      let statusError = null;
      let itemsError = null;
      
      // Fetch shop status
      try {
        const statusRes = await fetch(buildApiUrl('/shop/status'));
        if (!statusRes.ok) {
          let errorData;
          try {
            errorData = await statusRes.json();
          } catch (e) {
            errorData = { message: 'Failed to fetch shop status' };
          }
          throw { response: { status: statusRes.status, data: errorData } };
        }
        const statusData = await statusRes.json();
        if (statusData.success) {
          setShopStatus(statusData.data);
        }
      } catch (error) {
        statusError = error;
        console.error('[AdminDashboard] [fetchDashboardData] Error fetching shop status:', error.message);
      }

      // Fetch tea items stats
      try {
        const itemsRes = await fetch(buildApiUrl('/tea'));
        if (!itemsRes.ok) {
          let errorData;
          try {
            errorData = await itemsRes.json();
          } catch (e) {
            errorData = { message: 'Failed to fetch items' };
          }
          throw { response: { status: itemsRes.status, data: errorData } };
        }
        const itemsData = await itemsRes.json();
        if (itemsData.success) {
          const items = itemsData.data;
          const categories = new Set(items.map(item => item.category)).size;
          setStats({
            totalItems: items.length,
            availableItems: items.filter(item => item.isAvailable).length,
            categories,
          });
        }
      } catch (error) {
        itemsError = error;
        console.error('[AdminDashboard] [fetchDashboardData] Error fetching items:', error.message);
      }

      // Show error only if at least one fetch failed
      if (statusError || itemsError) {
        const errorMsg = statusError 
          ? 'Failed to load shop status' 
          : 'Failed to load item statistics';
        handleApiError({ response: { status: 500, data: { message: errorMsg } } });
      }
    } catch (error) {
      console.error('[AdminDashboard] [fetchDashboardData] Unexpected error:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleShopStatus = async () => {
    try {
      setToggling(true);
      const response = await fetch(buildApiUrl('/shop/status/toggle'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle shop status');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(`Shop is now ${data.data.isOpen ? 'OPEN' : 'CLOSED'}`);
      }
    } catch (error) {
      console.error('Error toggling shop status:', error);
      handleApiError(error, toast);
    } finally {
      setToggling(false);
    }
  };

  const quickLinks = [
    { title: 'Manage Items', path: '/items', icon: '🍵', color: 'from-green-400 to-green-600' },
    { title: 'Item Library', path: '/library', icon: '📚', color: 'from-blue-400 to-blue-600' },
    { title: 'Settings', path: '/settings', icon: '⚙️', color: 'from-purple-400 to-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-wood-100 via-primary-50 to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-wood-700 to-wood-600 shadow-soft-lg border-b-2 border-primary-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-amber-50">Admin Dashboard</h1>
              <p className="text-amber-100">Welcome back, {admin?.email}</p>
              <div className="flex items-center gap-2 mt-2">
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
                  className="w-2 h-2 bg-primary-400 rounded-full shadow-warm"
                />
                <span className="text-sm text-amber-200">Live sync active</span>
                {lastUpdate && (
                  <span className="text-xs text-gray-400">• {lastUpdate}</span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Shop Status Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft-lg p-6 mb-8 border border-primary-200"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-wood-900">Shop Status</h2>
              <p className="text-wood-600">Control your shop's open/closed status</p>
            </div>
            <div className="text-center">
              <div className={`text-6xl mb-2`}>
                {shopStatus?.isOpen ? '🟢' : '🔴'}
              </div>
              <p className={`text-xl font-bold mb-4 ${shopStatus?.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                {shopStatus?.isOpen ? 'OPEN' : 'CLOSED'}
              </p>
              <button
                onClick={toggleShopStatus}
                disabled={toggling || !shopStatus}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                  toggling || !shopStatus
                    ? 'opacity-50 cursor-not-allowed bg-gray-400'
                    : shopStatus?.isOpen
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {toggling ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating...
                  </span>
                ) : (
                  shopStatus?.isOpen ? 'Close Shop' : 'Open Shop'
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: "easeOut" }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft p-6 border border-primary-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-wood-600 text-sm mb-1">Total Items</p>
                <p className="text-4xl font-bold text-wood-900">{stats.totalItems}</p>
              </div>
              <div className="text-5xl">🍵</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft p-6 border border-primary-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-wood-600 text-sm mb-1">Available Items</p>
                <p className="text-4xl font-bold text-primary-600">{stats.availableItems}</p>
              </div>
              <div className="text-5xl">✅</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft p-6 border border-primary-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Categories</p>
                <p className="text-4xl font-bold text-purple-600">{stats.categories}</p>
              </div>
              <div className="text-5xl">📊</div>
            </div>
          </motion.div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-wood-900">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickLinks.map((link, index) => (
              <Link key={link.path} to={link.path}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                  whileHover={{ scale: 1.03, y: -5, transition: { duration: 0.3, ease: "easeOut" } }}
                  className={`bg-gradient-to-br ${link.color} rounded-2xl shadow-soft-lg hover:shadow-warm p-8 text-white cursor-pointer transition-all duration-300`}
                >
                  <div className="text-6xl mb-4">{link.icon}</div>
                  <h3 className="text-2xl font-bold">{link.title}</h3>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
