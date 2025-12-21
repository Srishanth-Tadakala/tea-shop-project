import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { buildApiUrl, WS_URL } from '../config/env';

const defaultContent = {
  contactPhone: '',
  contactEmail: '',
  contactAddress: '',
};

const Contact = () => {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const applyContent = (payload) => {
      if (!payload) return;
      setContent((prev) => ({
        contactPhone: payload.contactPhone !== undefined ? payload.contactPhone : prev.contactPhone,
        contactEmail: payload.contactEmail !== undefined ? payload.contactEmail : prev.contactEmail,
        contactAddress: payload.contactAddress !== undefined ? payload.contactAddress : prev.contactAddress,
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
        console.warn('[Contact] Failed to fetch content:', error.message);
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
    socket.on('connect_error', (err) => console.warn('[Contact] Socket error:', err?.message || err));

    return () => socket.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-amber-50 py-14 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft p-10 border border-primary-100"
        >
          <p className="text-sm text-gray-500 mb-2">Contact Us</p>
          <h1 className="text-4xl font-bold text-wood-900 mb-6">We would love to hear from you</h1>

          {loading ? (
            <p className="text-gray-500">Loading contact details...</p>
          ) : (
            <div className="space-y-4 text-wood-800">
              {content.contactPhone && (
                <div className="flex items-start gap-3">
                  <span className="text-xl">📞</span>
                  <div>
                    <p className="font-semibold">Phone</p>
                    <a href={`tel:${content.contactPhone}`} className="text-primary-600 hover:underline">
                      {content.contactPhone}
                    </a>
                  </div>
                </div>
              )}

              {content.contactEmail && (
                <div className="flex items-start gap-3">
                  <span className="text-xl">✉️</span>
                  <div>
                    <p className="font-semibold">Email</p>
                    <a href={`mailto:${content.contactEmail}`} className="text-primary-600 hover:underline">
                      {content.contactEmail}
                    </a>
                  </div>
                </div>
              )}

              {content.contactAddress && (
                <div className="flex items-start gap-3">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="font-semibold">Address</p>
                    <p className="whitespace-pre-line">{content.contactAddress}</p>
                  </div>
                </div>
              )}

              {!content.contactPhone && !content.contactEmail && !content.contactAddress && (
                <p className="text-gray-500">Contact details coming soon.</p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
