import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { useToastStore } from '../context/useToastStore';
import useCartStore from '../context/useCartStore';
import { handleApiError } from '../utils/apiUtils';
import { buildApiUrl, WS_URL } from '../config/env';

const Menu = () => {
  const toast = useToastStore();
  const { addItem } = useCartStore();
  const [teaItems, setTeaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [socket, setSocket] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  const handleAddToCart = (item) => {
    addItem(item);
    toast.success(`${item.name} added to cart!`);
  };

  useEffect(() => {
    fetchTeaItems();

    // Connect to WebSocket for real-time updates
    const socketConnection = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketConnection.on('connect', () => {
      console.log('Connected to WebSocket for menu updates');
    });

    socketConnection.on('connect_error', (err) => {
      console.warn('WebSocket connection error:', err?.message || err);
    });

    // Listen for tea item updates
    socketConnection.on('teaItem:created', (newItem) => {
      setTeaItems(prev => [...prev, newItem]);
      setLastUpdate(new Date().toLocaleTimeString());
    });

    socketConnection.on('teaItem:updated', (updatedItem) => {
      setTeaItems(prev => prev.map(item => 
        item._id === updatedItem._id ? updatedItem : item
      ));
      setLastUpdate(new Date().toLocaleTimeString());
    });

    socketConnection.on('teaItem:deleted', (deletedId) => {
      setTeaItems(prev => prev.filter(item => item._id !== deletedId));
      setLastUpdate(new Date().toLocaleTimeString());
    });

    // Listen for shop close auto-reset
    socketConnection.on('items:reset', () => {
      console.log('Shop closed - All items reset to unavailable');
      fetchTeaItems();
      setLastUpdate(new Date().toLocaleTimeString());
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const fetchTeaItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(buildApiUrl('/tea'));
      
      // Check response.ok BEFORE parsing JSON
      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[Menu] [fetchTeaItems] JSON parse error:', parseError);
          setError('Server response error. Please try again.');
          return;
        }
        throw { response: { status: response.status, data } };
      }
      
      const data = await response.json();
      if (data.success) {
        setTeaItems(data.data);
      } else {
        throw new Error(data.message || 'Failed to load menu');
      }
    } catch (error) {
      console.error('[Menu] [fetchTeaItems] Error:', error.message || error);
      setError(error.message || 'Failed to load menu. Please try again.');
      // Note: handleApiError shows duplicate toast, avoid using it here for fetch errors
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'green', 'black', 'oolong', 'white', 'herbal', 'blend', 'other'];

  const filteredItems = filter === 'all' 
    ? teaItems 
    : teaItems.filter(item => item.category === filter);

  const availableItems = filteredItems.filter(item => item.isAvailable);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wood-100 via-primary-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🍵</div>
          <div className="text-2xl text-wood-700">Loading menu...</div>
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
            onClick={fetchTeaItems}
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 text-wood-900">Today's Menu</h1>
          <p className="text-xl text-wood-700">Discover our handpicked selection of premium teas</p>
          
          {/* Live Update Indicator */}
          <div className="flex items-center justify-center gap-3 mt-4">
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
              className="w-2 h-2 bg-primary-500 rounded-full shadow-warm"
            />
            <span className="text-sm text-wood-600">Live Updates Enabled</span>
            {lastUpdate && (
              <span className="text-xs text-gray-400">• Last update: {lastUpdate}</span>
            )}
          </div>
          <div className="mt-2">
            <span className="text-lg font-semibold text-primary-600">
              {availableItems.length} items available today
            </span>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                filter === category
                  ? 'bg-gradient-to-r from-primary-500 to-chai-dark text-white shadow-soft-lg scale-105'
                  : 'bg-white/80 backdrop-blur-sm text-wood-700 hover:bg-white border border-primary-100 hover:border-primary-300 hover:shadow-soft'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Items Grid */}
        {availableItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500">No items available in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {availableItems.map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.6, ease: "easeOut" }}
                whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden border border-primary-100"
              >
                <div className="h-48 bg-gradient-to-br from-primary-100 to-amber-100 flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">🍵</span>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-wood-900">{item.name}</h3>
                    <span className="text-xl font-bold text-primary-600">${item.price.toFixed(2)}</span>
                  </div>
                  {item.description && (
                    <p className="text-wood-600 mb-4">{item.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium border border-primary-200">
                      {item.category}
                    </span>
                    {item.rating > 0 && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium border border-amber-200">
                        ⭐ {item.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-wood-500 mb-1">Ingredients:</p>
                      <p className="text-sm text-wood-700">{item.ingredients.join(', ')}</p>
                    </div>
                  )}
                  <button 
                    onClick={() => handleAddToCart(item)}
                    className="w-full bg-gradient-to-r from-primary-500 to-chai-dark text-white py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-chai-dark transition-all duration-300 shadow-soft hover:shadow-soft-lg"
                  >
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
