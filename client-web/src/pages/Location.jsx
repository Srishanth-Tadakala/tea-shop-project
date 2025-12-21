import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { useToastStore } from '../context/useToastStore';
import { buildApiUrl, WS_URL } from '../config/env';

const defaultShopInfo = {
  name: 'Tea Shop',
  address: '123 Tea Street, Beverly Hills, CA 90210',
  phone: '+1 (234) 567-890',
  email: 'info@teashop.com',
  hours: {
    weekdays: '9:00 AM - 6:00 PM',
    saturday: '10:00 AM - 8:00 PM',
    sunday: '10:00 AM - 5:00 PM'
  },
  coordinates: {
    lat: 34.0736,
    lng: -118.4004
  },
  googleMapsUrl: ''
};

const buildMapEmbedUrl = (info) => {
  const mapUrl = info?.googleMapsUrl?.trim();
  if (mapUrl) return mapUrl;

  const hasCoords = typeof info?.coordinates?.lat === 'number' && typeof info?.coordinates?.lng === 'number';
  if (hasCoords) {
    return `https://www.google.com/maps?q=${info.coordinates.lat},${info.coordinates.lng}&z=15&output=embed`;
  }

  return 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3305.5989472793855!2d-118.40286708478744!3d34.073611780600305!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2bc04d6d147ab%3A0x196a77a00c1e1a2d!2sBeverly%20Hills%2C%20CA%2090210!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus';
};

const Location = () => {
  const warningToast = useToastStore((state) => state.warning);
  const [shopInfo, setShopInfo] = useState(defaultShopInfo);
  const [mapEmbedUrl, setMapEmbedUrl] = useState(buildMapEmbedUrl(defaultShopInfo));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const applyLocation = (payload) => {
      if (!payload) return;

      setShopInfo((prev) => {
        const hasGoogleUrl = payload.googleMapsUrl !== undefined && payload.googleMapsUrl !== null;
        const parsedLat = payload.latitude === 0 || payload.latitude ? Number(payload.latitude) : null;
        const parsedLng = payload.longitude === 0 || payload.longitude ? Number(payload.longitude) : null;
        const merged = {
          ...prev,
          address: payload.address || prev.address,
          googleMapsUrl: hasGoogleUrl ? payload.googleMapsUrl : prev.googleMapsUrl,
          coordinates: {
            lat: Number.isNaN(parsedLat) || parsedLat === null ? prev.coordinates.lat : parsedLat,
            lng: Number.isNaN(parsedLng) || parsedLng === null ? prev.coordinates.lng : parsedLng,
          },
        };

        setMapEmbedUrl(buildMapEmbedUrl(merged));
        return merged;
      });
    };

    const fetchLocation = async () => {
      setLoading(true);
      try {
        const response = await fetch(buildApiUrl('/shop/location'));
        const data = await response.json();

        if (response.ok && data?.success) {
          applyLocation(data.data);
        } else {
          warningToast?.('Showing default shop location');
        }
      } catch (error) {
        console.error('[Location] Failed to load shop location:', error.message);
        warningToast?.('Live location unavailable, showing default');
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();

    const socket = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('shopLocation:updated', (payload) => {
      applyLocation(payload);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Location] WebSocket connection error:', err?.message || err);
    });

    return () => {
      socket.disconnect();
    };
  }, [warningToast]);

  const openGoogleMaps = () => {
    if (shopInfo.googleMapsUrl) {
      window.open(shopInfo.googleMapsUrl, '_blank');
      return;
    }

    const { lat, lng } = shopInfo.coordinates || {};
    if (typeof lat === 'number' && typeof lng === 'number') {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
      return;
    }

    window.open('https://maps.google.com', '_blank');
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 text-gray-900">Visit Us</h1>
          <p className="text-xl text-gray-600">Find your way to the finest tea experience</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="h-96 bg-gray-200 relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-gray-700 text-sm font-medium z-10">
                  Loading latest location...
                </div>
              )}
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Shop Location"
                className="w-full h-full"
              ></iframe>
            </div>
            <div className="p-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openGoogleMaps}
                className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-xl">📍</span>
                Get Directions in Google Maps
              </motion.button>
            </div>
          </motion.div>

          {/* Information Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Contact Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">📍</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                    <p className="text-gray-600">{shopInfo.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-2xl">📞</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                    <a href={`tel:${shopInfo.phone}`} className="text-primary-600 hover:underline">
                      {shopInfo.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-2xl">✉️</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <a href={`mailto:${shopInfo.email}`} className="text-primary-600 hover:underline">
                      {shopInfo.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Opening Hours</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Monday - Friday</span>
                  <span className="text-gray-900 font-semibold">{shopInfo.hours.weekdays}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Saturday</span>
                  <span className="text-gray-900 font-semibold">{shopInfo.hours.saturday}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-gray-700">Sunday</span>
                  <span className="text-gray-900 font-semibold">{shopInfo.hours.sunday}</span>
                </div>
              </div>
            </div>

            {/* Parking & Accessibility */}
            <div className="bg-primary-600 text-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-4">Parking & Accessibility</h2>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Free parking available</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Wheelchair accessible</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Public transport nearby</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Location;
