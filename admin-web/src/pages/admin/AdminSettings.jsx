import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import useAuthStore from '../../context/useAuthStore';
import { useToastStore } from '../../context/useToastStore';
import { handleApiError } from '../../utils/apiUtils';
import { buildApiUrl } from '../../config/env';

const AdminSettings = () => {
  const { admin, updatePassword } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [shopSettings, setShopSettings] = useState({
    openingTime: '09:00',
    closingTime: '18:00',
  });
  const [locationForm, setLocationForm] = useState({
    address: '',
    googleMapsUrl: '',
    latitude: '',
    longitude: '',
  });
  const [contentForm, setContentForm] = useState({
    aboutTitle: '',
    aboutDescription: '',
    contactPhone: '',
    contactEmail: '',
    contactAddress: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [savingLocation, setSavingLocation] = useState(false);
  const [loadingContent, setLoadingContent] = useState(true);
  const [savingContent, setSavingContent] = useState(false);

  useEffect(() => {
    const loadLocation = async () => {
      setLoadingLocation(true);
      try {
        const response = await fetch(buildApiUrl('/shop/location'));
        const data = await response.json();

        if (response.ok && data?.success) {
          const loc = data.data || {};
          setLocationForm({
            address: loc.address || '',
            googleMapsUrl: loc.googleMapsUrl || '',
            latitude: loc.latitude === 0 || loc.latitude ? String(loc.latitude) : '',
            longitude: loc.longitude === 0 || loc.longitude ? String(loc.longitude) : '',
          });
        } else {
          addToast('Failed to load shop location', 'error');
        }
      } catch (error) {
        handleApiError({ response: null, message: error.message }, 'Failed to load shop location');
      } finally {
        setLoadingLocation(false);
      }
    };

    const loadContent = async () => {
      setLoadingContent(true);
      try {
        const response = await fetch(buildApiUrl('/content'));
        const data = await response.json();

        if (response.ok && data?.success) {
          const content = data.data || {};
          setContentForm({
            aboutTitle: content.aboutTitle || '',
            aboutDescription: content.aboutDescription || '',
            contactPhone: content.contactPhone || '',
            contactEmail: content.contactEmail || '',
            contactAddress: content.contactAddress || '',
          });
        } else {
          addToast('Failed to load content', 'error');
        }
      } catch (error) {
        handleApiError({ response: null, message: error.message }, 'Failed to load content');
      } finally {
        setLoadingContent(false);
      }
    };

    loadLocation();
    loadContent();
  }, [addToast]);

  const handleSaveShopSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    addToast('Shop settings saved successfully!', 'success');
    setSavingSettings(false);
  };

  const handleSaveContent = async (e) => {
    e.preventDefault();
    setSavingContent(true);

    if (!contentForm.aboutTitle.trim()) {
      addToast('About title is required', 'error');
      setSavingContent(false);
      return;
    }

    if (!contentForm.aboutDescription.trim()) {
      addToast('About description is required', 'error');
      setSavingContent(false);
      return;
    }

    if (contentForm.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contentForm.contactEmail)) {
      addToast('Contact email is invalid', 'error');
      setSavingContent(false);
      return;
    }

    const payload = {
      aboutTitle: contentForm.aboutTitle.trim(),
      aboutDescription: contentForm.aboutDescription.trim(),
      contactPhone: contentForm.contactPhone.trim(),
      contactEmail: contentForm.contactEmail.trim(),
      contactAddress: contentForm.contactAddress.trim(),
    };

    try {
      const response = await fetch(buildApiUrl('/admin/content'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw {
          response: { status: response.status, data },
          message: data?.message || 'Failed to update content',
        };
      }

      const content = data.data || {};
      setContentForm({
        aboutTitle: content.aboutTitle || '',
        aboutDescription: content.aboutDescription || '',
        contactPhone: content.contactPhone || '',
        contactEmail: content.contactEmail || '',
        contactAddress: content.contactAddress || '',
      });

      addToast('Content updated', 'success');
    } catch (error) {
      handleApiError(error, 'Failed to update content');
    } finally {
      setSavingContent(false);
    }
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    setSavingLocation(true);

    if (!locationForm.address.trim()) {
      addToast('Address is required', 'error');
      setSavingLocation(false);
      return;
    }

    const latProvided = locationForm.latitude !== '' && locationForm.latitude !== null;
    const lngProvided = locationForm.longitude !== '' && locationForm.longitude !== null;

    if (latProvided && Number.isNaN(Number(locationForm.latitude))) {
      addToast('Latitude must be a number', 'error');
      setSavingLocation(false);
      return;
    }

    if (lngProvided && Number.isNaN(Number(locationForm.longitude))) {
      addToast('Longitude must be a number', 'error');
      setSavingLocation(false);
      return;
    }

    const payload = {
      address: locationForm.address.trim(),
      googleMapsUrl: locationForm.googleMapsUrl.trim(),
      latitude: latProvided ? Number(locationForm.latitude) : null,
      longitude: lngProvided ? Number(locationForm.longitude) : null,
    };

    try {
      const response = await fetch(buildApiUrl('/admin/shop/location'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw {
          response: { status: response.status, data },
          message: data?.message || 'Failed to update shop location',
        };
      }

      const loc = data.data || {};
      setLocationForm({
        address: loc.address || '',
        googleMapsUrl: loc.googleMapsUrl || '',
        latitude: loc.latitude === 0 || loc.latitude ? String(loc.latitude) : '',
        longitude: loc.longitude === 0 || loc.longitude ? String(loc.longitude) : '',
      });

      addToast('Shop location updated', 'success');
    } catch (error) {
      handleApiError(error, 'Failed to update shop location');
    } finally {
      setSavingLocation(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);

    const result = await updatePassword(passwordForm.currentPassword, passwordForm.newPassword);

    if (result.success) {
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to update password' });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/dashboard" className="text-primary-600 hover:underline mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your admin account settings</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Account Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={admin?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value={admin?.role || ''}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed capitalize"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
                <input
                  type="text"
                  value={admin?.id || ''}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed font-mono text-sm"
                />
              </div>
            </div>
          </motion.div>

          {/* Change Password */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Change Password</h2>
            
            {message.text && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg mb-6 ${
                  message.type === 'success'
                    ? 'bg-green-100 border border-green-400 text-green-700'
                    : 'bg-red-100 border border-red-400 text-red-700'
                }`}
              >
                {message.text}
              </motion.div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter current password"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter new password (min 6 characters)"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Confirm new password"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </motion.div>

          {/* Shop Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Shop Settings</h2>
            <form onSubmit={handleSaveShopSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Opening Time
                </label>
                <input
                  type="time"
                  value={shopSettings.openingTime}
                  onChange={(e) => setShopSettings({ ...shopSettings, openingTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Closing Time
                </label>
                <input
                  type="time"
                  value={shopSettings.closingTime}
                  onChange={(e) => setShopSettings({ ...shopSettings, closingTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={savingSettings}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  savingSettings
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {savingSettings ? 'Saving...' : 'Save Shop Settings'}
              </button>
            </form>
          </motion.div>

          {/* Content Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.23 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">About Us</h2>
            <form onSubmit={handleSaveContent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={contentForm.aboutTitle}
                  onChange={(e) => setContentForm({ ...contentForm, aboutTitle: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="About our tea shop"
                  disabled={loadingContent || savingContent}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={contentForm.aboutDescription}
                  onChange={(e) => setContentForm({ ...contentForm, aboutDescription: e.target.value })}
                  required
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Tell your story, mission, and values"
                  disabled={loadingContent || savingContent}
                />
              </div>

              <h3 className="text-xl font-bold mt-6 text-gray-900">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={contentForm.contactPhone}
                    onChange={(e) => setContentForm({ ...contentForm, contactPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                    disabled={loadingContent || savingContent}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={contentForm.contactEmail}
                    onChange={(e) => setContentForm({ ...contentForm, contactEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="hello@teashop.com"
                    disabled={loadingContent || savingContent}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={contentForm.contactAddress}
                  onChange={(e) => setContentForm({ ...contentForm, contactAddress: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="123 Tea Street, City, Country"
                  disabled={loadingContent || savingContent}
                />
              </div>

              <button
                type="submit"
                disabled={savingContent || loadingContent}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  savingContent || loadingContent
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {savingContent || loadingContent ? 'Saving...' : 'Save Content'}
              </button>
            </form>
          </motion.div>

          {/* Shop Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Shop Location</h2>
            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={locationForm.address}
                  onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                  required
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter full shop address"
                  disabled={loadingLocation || savingLocation}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Maps URL
                </label>
                <input
                  type="url"
                  value={locationForm.googleMapsUrl}
                  onChange={(e) => setLocationForm({ ...locationForm, googleMapsUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://maps.google.com/..."
                  disabled={loadingLocation || savingLocation}
                />
                <p className="text-xs text-gray-500 mt-1">Optional: paste the Google Maps share link to ensure accurate embedding</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude (optional)
                  </label>
                  <input
                    type="text"
                    value={locationForm.latitude}
                    onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., 34.0736"
                    disabled={loadingLocation || savingLocation}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude (optional)
                  </label>
                  <input
                    type="text"
                    value={locationForm.longitude}
                    onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., -118.4004"
                    disabled={loadingLocation || savingLocation}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingLocation || loadingLocation}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  savingLocation || loadingLocation
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {savingLocation || loadingLocation ? 'Saving...' : 'Save Location'}
              </button>
            </form>
          </motion.div>

          {/* Security Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-blue-900 mb-2">Security Tips</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <span>🔒</span>
                <span>Use a strong password with at least 8 characters</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🔐</span>
                <span>Never share your admin credentials</span>
              </li>
              <li className="flex items-start gap-2">
                <span>⏰</span>
                <span>Change your password regularly</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🚪</span>
                <span>Always log out when leaving your device</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
