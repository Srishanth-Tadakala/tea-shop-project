import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { buildApiUrl, WS_URL } from '../config/env';

const defaultContent = {
  aboutTitle: 'About Our Tea Shop',
  aboutDescription: 'We craft memorable tea experiences with care and quality.',
};

const About = () => {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const applyContent = (payload) => {
      if (!payload) return;
      setContent((prev) => ({
        aboutTitle: payload.aboutTitle || prev.aboutTitle,
        aboutDescription: payload.aboutDescription || prev.aboutDescription,
      }));
    };

    const fetchContent = async () => {
      setLoading(true);
      try {
        const res = await fetch(buildApiUrl('/content'));
        const data = await res.json();
        if (res.ok && data?.success) {
          applyContent(data.data);
        }
      } catch (error) {
        console.warn('[About] Failed to fetch content:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();

    const socket = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('content:updated', (payload) => applyContent(payload));
    socket.on('connect_error', (err) => console.warn('[About] Socket error:', err?.message || err));

    return () => socket.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-primary-50 py-14 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft p-10 border border-primary-100"
        >
          <p className="text-sm text-gray-500 mb-2">Our Story</p>
          <h1 className="text-4xl font-bold text-wood-900 mb-6">{content.aboutTitle}</h1>
          {loading ? (
            <p className="text-gray-500">Loading content...</p>
          ) : (
            <p className="text-lg text-wood-700 leading-relaxed whitespace-pre-line">
              {content.aboutDescription}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default About;
