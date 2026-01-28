import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import useAuthStore from '../../context/useAuthStore';
import { useToastStore } from '../../context/useToastStore';
import { handleApiError, validateInput } from '../../utils/apiUtils';
import ConfirmDialog from '../../components/ConfirmDialog';
import { buildApiUrl, WS_URL } from '../../config/env';

const AdminItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [socket, setSocket] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, itemId: null });
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const { token } = useAuthStore();
  const toast = useToastStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'green',
    ingredients: '',
    image: '',
    isAvailable: true,
    stock: 0,
  });

  useEffect(() => {
    fetchItems();

    // Connect to WebSocket for real-time updates
    let isMounted = true; // Cleanup flag to prevent state updates after unmount

    const socketConnection = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketConnection.on('connect', () => {
      console.log('[AdminItems] [WebSocket] Connected');
      socketConnection.emit('join:admin');
    });

    socketConnection.on('connect_error', (err) => {
      console.error('[AdminItems] [WebSocket] Connection error:', err?.message || err);
    });

    // Listen for tea item updates from other admin sessions
    socketConnection.on('teaItem:created', (newItem) => {
      if (isMounted) {
        setItems(prev => [...prev, newItem]);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    });

    socketConnection.on('teaItem:updated', (updatedItem) => {
      if (isMounted) {
        setItems(prev => prev.map(item => 
          item._id === updatedItem._id ? updatedItem : item
        ));
        setLastUpdate(new Date().toLocaleTimeString());
      }
    });

    socketConnection.on('teaItem:deleted', (deletedId) => {
      if (isMounted) {
        setItems(prev => prev.filter(item => item._id !== deletedId));
        setLastUpdate(new Date().toLocaleTimeString());
      }
    });

    // Listen for shop close auto-reset
    socketConnection.on('items:reset', () => {
      if (isMounted) {
        fetchItems();
        setLastUpdate(new Date().toLocaleTimeString());
      }
    });

    // Listen for socket disconnect
    socketConnection.on('disconnect', (reason) => {
      console.warn(`[AdminItems] [WebSocket] Disconnected - Reason: ${reason}`);
    });

    setSocket(socketConnection);

    return () => {
      isMounted = false;
      socketConnection.disconnect();
    };
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(buildApiUrl('/tea'));
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`[AdminItems] [fetchItems] HTTP ${response.status}:`, data);
        throw { response: { status: response.status, data } };
      }
      
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error('[AdminItems] [fetchItems] Error:', error.message, error);
      handleApiError(error, 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    
    const nameError = validateInput.required(formData.name, 'Name');
    if (nameError) errors.name = nameError;
    
    const priceError = validateInput.price(formData.price);
    if (priceError) errors.price = priceError;
    
    const stockError = validateInput.number(formData.stock, 'Stock');
    if (stockError) errors.stock = stockError;
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix validation errors');
      return;
    }
    
    setFormErrors({});
    setSubmitting(true);

    let itemData = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock) || 0,
      ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(Boolean),
    };

    // Check if image data is too large (>1MB base64 = ~750KB binary)
    // If so, remove it and let the default image be used
    if (itemData.image && itemData.image.length > 1000000) {
      console.warn('[AdminItems] [handleSubmit] Image too large, removing from submission');
      itemData.image = '';
      toast.warning('Image was too large, using default image instead');
    }

    try {
      const url = editingItem ? buildApiUrl(`/tea/${editingItem._id}`) : buildApiUrl('/tea');
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(itemData),
      });

      // Check response.ok BEFORE parsing JSON to avoid crashes
      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[AdminItems] [handleSubmit] JSON parse error:', parseError);
          throw { response: { status: response.status, data: { message: 'Invalid server response' } } };
        }
        throw { response: { status: response.status, data } };
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success(editingItem ? 'Item updated successfully' : 'Item created successfully');
        fetchItems();
        closeModal();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error(`[AdminItems] [handleSubmit] Error: ${editingItem ? 'update' : 'create'}:`, error);
      handleApiError(error, editingItem ? 'Failed to update item' : 'Failed to create item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(buildApiUrl(`/tea/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      // Check response.ok BEFORE parsing JSON
      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[AdminItems] [handleDelete] JSON parse error:', parseError);
          throw { response: { status: response.status, data: { message: 'Invalid server response' } } };
        }
        throw { response: { status: response.status, data } };
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Item deleted successfully');
        fetchItems();
      } else {
        toast.error(data.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('[AdminItems] [handleDelete] Error:', error);
      handleApiError(error, 'Failed to delete item');
    }
  };

  const confirmDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      action: 'delete',
      itemId: id,
    });
  };

  const toggleAvailability = async (id) => {
    try {
      const response = await fetch(buildApiUrl(`/tea/${id}/availability`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      // Check response.ok BEFORE parsing JSON
      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[AdminItems] [toggleAvailability] JSON parse error:', parseError);
          throw { response: { status: response.status, data: { message: 'Invalid server response' } } };
        }
        throw { response: { status: response.status, data } };
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Availability updated');
        fetchItems();
      } else {
        toast.error(data.message || 'Failed to update availability');
      }
    } catch (error) {
      console.error('[AdminItems] [toggleAvailability] Error:', error);
      handleApiError(error, 'Failed to update availability');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        // Only store in preview, warn if too large for submission
        if (base64String.length > 500000) { // ~500KB in base64
          toast.warning('Image is large and may slow down submission. Consider using a smaller image.');
        }
        setImagePreview(base64String);
        setFormData({ ...formData, image: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        category: item.category,
        ingredients: item.ingredients?.join(', ') || '',
        image: item.image || '',
        isAvailable: item.isAvailable,
        stock: item.stock,
      });
      setImagePreview(item.image || null);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'green',
        ingredients: '',
        image: '',
        isAvailable: true,
        stock: 0,
      });
      setImagePreview(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setImagePreview(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading items...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wood-100 via-primary-50 to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-wood-700 to-wood-600 shadow-soft-lg border-b-2 border-primary-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link to="/dashboard" className="text-amber-300 hover:text-amber-200 mb-2 inline-block transition-colors">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-amber-50">Manage Items</h1>
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
              onClick={() => openModal()}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              + Add New Item
            </button>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden border border-primary-100"
            >
              <div className={`h-32 bg-gradient-to-br ${item.isAvailable ? 'from-primary-100 to-amber-100' : 'from-wood-100 to-wood-200'} flex items-center justify-center overflow-hidden`}>
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl">🍵</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{item.name}</h3>
                  <span className="text-lg font-bold text-primary-600">₹{item.price.toFixed(2)}</span>
                </div>
                {item.description && (
                  <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                )}
                <div className="flex gap-2 mb-3">
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                    {item.category}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAvailability(item._id)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
                    title="Toggle availability"
                  >
                    Toggle
                  </button>
                  <button
                    onClick={() => openModal(item)}
                    className="flex-1 px-3 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm transition-colors"
                    title="Edit item"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(item._id)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
                    title="Delete item"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium mb-2">Product Image</label>
                  <div className="space-y-3">
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData({ ...formData, image: '' });
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    
                    {/* Upload Buttons */}
                    <div className="flex gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <span>📁</span>
                        <span>Choose from Gallery</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <span>📷</span>
                        <span>Take Photo</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name) {
                          setFormErrors({ ...formErrors, name: '' });
                        }
                      }}
                      required
                      className={`w-full px-3 py-2 border rounded-lg ${
                        formErrors.name ? 'border-red-500' : ''
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value });
                        if (formErrors.price) {
                          setFormErrors({ ...formErrors, price: '' });
                        }
                      }}
                      required
                      className={`w-full px-3 py-2 border rounded-lg ${
                        formErrors.price ? 'border-red-500' : ''
                      }`}
                    />
                    {formErrors.price && (
                      <p className="text-red-600 text-sm mt-1">{formErrors.price}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="green">Green</option>
                      <option value="black">Black</option>
                      <option value="oolong">Oolong</option>
                      <option value="white">White</option>
                      <option value="herbal">Herbal</option>
                      <option value="blend">Blend</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => {
                        setFormData({ ...formData, stock: e.target.value });
                        if (formErrors.stock) {
                          setFormErrors({ ...formErrors, stock: '' });
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        formErrors.stock ? 'border-red-500' : ''
                      }`}
                    />
                    {formErrors.stock && (
                      <p className="text-red-600 text-sm mt-1">{formErrors.stock}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ingredients (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Green tea, Jasmine, Honey"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isAvailable" className="text-sm font-medium">Available for sale</label>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold transition-all ${
                      submitting
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-primary-700'
                    }`}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      editingItem ? 'Update Item' : 'Create Item'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null, itemId: null })}
        onConfirm={() => {
          if (confirmDialog.action === 'delete' && confirmDialog.itemId) {
            handleDelete(confirmDialog.itemId);
          }
          setConfirmDialog({ isOpen: false, action: null, itemId: null });
        }}
        title="Delete Item?"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        isDangerous={true}
      />
    </div>
  );
};

export default AdminItems;
