import { motion } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import WebGLErrorBoundary from '../components/WebGLErrorBoundary';
import TeaFallback from '../components/TeaFallback';
import { buildApiUrl, WS_URL } from '../config/env';

// Lazy load 3D components for better performance
const TeaScene = lazy(() => import('../three/TeaScene'));

const Home = () => {
  const [status, setStatus] = useState({ isOpen: null });
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    const applyStatus = (payload) => {
      if (!payload) return;
      setStatus({ isOpen: payload.isOpen, message: payload.message });
    };

    const fetchStatus = async () => {
      setStatusLoading(true);
      try {
        const res = await fetch(buildApiUrl('/shop/status'));
        const data = await res.json();
        if (res.ok && data?.success) {
          applyStatus(data.data);
        }
      } catch (error) {
        console.warn('[Home] Failed to fetch shop status:', error.message);
      } finally {
        setStatusLoading(false);
      }
    };

    fetchStatus();

    const socket = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('shopStatus:updated', applyStatus);
    socket.on('shop-status-updated', applyStatus);
    socket.on('connect_error', (err) => console.warn('[Home] Socket error:', err?.message || err));

    return () => socket.disconnect();
  }, []);

  const isOpen = status.isOpen === null ? true : Boolean(status.isOpen);
  const statusText = isOpen ? 'OPEN' : 'CLOSED';
  const statusColor = isOpen ? 'from-green-500 to-emerald-600' : 'from-gray-500 to-slate-600';
  const statusGlow = isOpen ? 'shadow-[0_0_25px_rgba(34,197,94,0.35)]' : 'shadow-[0_0_18px_rgba(100,116,139,0.25)]';

  return (
    <div className="min-h-screen">
      {/* Hero Section with 3D Tea Cup */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative h-screen flex items-center justify-center bg-gradient-to-br from-wood-100 via-primary-50 to-amber-100"
      >
        {/* 3D Tea Cup Background */}
        <div className="absolute inset-0 w-full h-full opacity-90">
          <WebGLErrorBoundary fallback={<TeaFallback />}>
            <Suspense fallback={<TeaFallback />}>
              <TeaScene performanceMode={false} statusOpen={isOpen} />
            </Suspense>
          </WebGLErrorBoundary>
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 text-center px-4 bg-white/40 backdrop-blur-md rounded-3xl p-12 shadow-warm border border-primary-200/50">
          <div className="flex justify-center mb-4">
            <div
              className={`inline-flex items-center gap-3 px-5 py-2 rounded-full bg-gradient-to-r ${statusColor} text-white font-semibold ${statusGlow}`}
              aria-live="polite"
              aria-label={`Shop status: ${statusText}`}
            >
              <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
              <span className="text-sm tracking-wide">
                {statusLoading ? 'Checking status...' : `We are ${statusText}`}
              </span>
            </div>
          </div>
          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-bold text-wood-900 mb-6 drop-shadow-sm"
          >
            Welcome to Tea Shop
          </motion.h1>
          <motion.p
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
            className="text-xl md:text-2xl text-wood-700 mb-8"
          >
            Discover the finest teas from around the world
          </motion.p>
          <Link to="/menu">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
              whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(217, 119, 6, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              className="inline-block bg-gradient-to-r from-primary-500 to-chai-dark text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-primary-600 hover:to-chai-dark transition-all shadow-soft-lg"
            >
              Explore Collection
            </motion.div>
          </Link>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-4xl font-bold text-center mb-12 text-wood-900"
        >
          Why Choose Us
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🌿', title: 'Premium Quality', desc: 'Hand-picked organic teas' },
            { icon: '🚚', title: 'Fast Delivery', desc: 'Fresh tea at your doorstep' },
            { icon: '💚', title: 'Eco-Friendly', desc: 'Sustainable packaging' },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.8, ease: "easeOut" }}
              whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
              className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 text-center border border-primary-100"
            >
              <div className="text-6xl mb-4 animate-slow-float">{feature.icon}</div>
              <h3 className="text-2xl font-bold mb-2 text-wood-800">{feature.title}</h3>
              <p className="text-wood-600">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
