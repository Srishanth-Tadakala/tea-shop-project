import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import useAuthStore from '../../context/useAuthStore';
import { useToastStore } from '../../context/useToastStore';
import { handleApiError, apiRequest } from '../../utils/apiUtils';
import ConfirmDialog from '../../components/ConfirmDialog';
import { WS_URL } from '../../config/env';

const AdminLibrary = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [socket, setSocket] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const { token } = useAuthStore();
  const toast = useToastStore();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: 'other',
    ingredients: '',
    tags: '',
    notes: ''
  });

  useEffect(() => {
    fetchTemplates();

    // Connect to WebSocket for real-time updates
    const socketConnection = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketConnection.on('connect', () => {
      console.log('Admin library connected to WebSocket');
      socketConnection.emit('join:admin');
    });

    socketConnection.on('connect_error', (err) => {
      console.warn('WebSocket connection error:', err?.message || err);
    });

    // Listen for real-time template/item updates
    socketConnection.on('teaItem:created', () => {
      // Refresh templates to update usage counts
      fetchTemplates();
      setLastUpdate(new Date().toLocaleTimeString());
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const result = await apiRequest('/api/library', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Check for error from apiRequest wrapper
      if (result.error) {
        console.error('[AdminLibrary] [fetchTemplates] API error:', result.error);
        handleApiError(result.error, toast);
        return;
      }

      const data = result.data;
      if (data?.success) {
        setTemplates(data.data);
      } else {
        console.error('[AdminLibrary] [fetchTemplates] API returned success=false:', data?.message);
        toast.error(data?.message || 'Failed to load templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      handleApiError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      basePrice: '',
      category: 'other',
      ingredients: '',
      tags: '',
      notes: ''
    });
  };

  const handleAddTemplate = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      basePrice: template.basePrice.toString(),
      category: template.category,
      ingredients: template.ingredients?.join(', ') || '',
      tags: template.tags?.join(', ') || '',
      notes: template.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submitting) return;
    
    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        basePrice: parseFloat(formData.basePrice),
        category: formData.category,
        ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(Boolean),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        notes: formData.notes.trim()
      };

      if (editingTemplate) {
        // Update existing template
        const result = await apiRequest(`/api/library/${editingTemplate._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload)
        });

        if (result.error) {
          console.error('[AdminLibrary] [handleSubmit] Update error:', result.error);
          handleApiError(result.error, toast);
          return;
        }

        const data = result.data;
        if (data?.success) {
          toast.success('Template updated successfully');
          setShowEditModal(false);
          setEditingTemplate(null);
          fetchTemplates();
        } else {
          toast.error(data?.message || 'Failed to update template');
        }
      } else {
        // Create new template
        const result = await apiRequest('/api/library', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload)
        });

        if (result.error) {
          console.error('[AdminLibrary] [handleSubmit] Create error:', result.error);
          handleApiError(result.error, toast);
          return;
        }

        const data = result.data;
        if (data?.success) {
          toast.success('Template created successfully');
          setShowAddModal(false);
          fetchTemplates();
        } else {
          toast.error(data?.message || 'Failed to create template');
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
      handleApiError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      const result = await apiRequest(`/api/library/${templateId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (result.error) {
        console.error('[AdminLibrary] [handleDeleteTemplate] Error:', result.error);
        handleApiError(result.error, toast);
        return;
      }

      const data = result.data;
      if (data?.success) {
        toast.success('Template deleted successfully');
        fetchTemplates();
      } else {
        toast.error(data?.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      handleApiError(error, toast);
    }
  };

  const createFromTemplate = async (templateId) => {
    try {
      const result = await apiRequest(`/api/library/${templateId}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (result.error) {
        console.error('[AdminLibrary] [createFromTemplate] Error:', result.error);
        handleApiError(result.error, toast);
        return;
      }

      const data = result.data;
      if (data?.success) {
        toast.success('Tea item created from template!');
        fetchTemplates(); // Refresh to update usage count
      } else {
        toast.error(data?.message || 'Failed to create item from template');
      }
    } catch (error) {
      console.error('Error creating from template:', error);
      handleApiError(error, toast);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading library...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link to="/dashboard" className="text-primary-600 hover:underline mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Item Library</h1>
              <p className="text-gray-600">Reusable templates for quick item creation</p>
            </div>
            <button 
              onClick={handleAddTemplate}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              + Add Template
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {templates.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-2xl text-gray-500 mb-4">No templates yet</p>
            <p className="text-gray-400">Create your first reusable template</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, index) => (
              <motion.div
                key={template._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 h-32 flex items-center justify-center">
                  <span className="text-5xl">📄</span>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
                    <span className="text-lg font-bold text-primary-600">
                      ${template.basePrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                      {template.category}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      Used {template.usageCount}x
                    </span>
                  </div>

                  {template.ingredients && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Ingredients:</p>
                      <p className="text-sm text-gray-700">
                        {template.ingredients.join(', ')}
                      </p>
                    </div>
                  )}

                  {template.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Notes:</p>
                      <p className="text-sm text-gray-700">{template.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => createFromTemplate(template._id)}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                    >
                      Use Template
                    </button>
                    <button 
                      onClick={() => handleEditTemplate(template)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => setConfirmDelete(template)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-primary-600 text-white rounded-xl shadow-lg p-8 mt-8"
        >
          <h2 className="text-2xl font-bold mb-4">About Item Library</h2>
          <p className="text-lg mb-4">
            Item templates help you quickly create new tea items with pre-configured settings. 
            Perfect for seasonal variations or frequently ordered custom blends.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span>✓</span>
              <span>Save time with reusable configurations</span>
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span>
              <span>Track template usage analytics</span>
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span>
              <span>Maintain consistency across items</span>
            </li>
          </ul>
        </motion.div>
      </div>

      {/* Add/Edit Template Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingTemplate ? 'Edit Template' : 'Add New Template'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Classic Green Tea"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Describe the tea template..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price * ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ingredients (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Green tea leaves, Natural flavors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="organic, caffeine-free"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setEditingTemplate(null);
                      resetForm();
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Template?"
          message={`Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => {
            handleDeleteTemplate(confirmDelete._id);
            setConfirmDelete(null);
          }}
          onClose={() => setConfirmDelete(null)}
          variant="danger"
        />
      )}
    </div>
  );
};

export default AdminLibrary;
