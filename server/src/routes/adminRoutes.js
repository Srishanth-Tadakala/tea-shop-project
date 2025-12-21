import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Admin from '../models/Admin.js';
import { updateShopLocation } from '../controllers/shopController.js';
import { updateContent } from '../controllers/contentController.js';

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);

// @desc    Update shop location
// @route   PUT /api/admin/shop/location
// @access  Private/Admin
router.put('/shop/location', authorize('admin', 'superadmin'), updateShopLocation);

// @desc    Update site content (About/Contact)
// @route   PUT /api/admin/content
// @access  Private/Admin
router.put('/content', authorize('admin', 'superadmin'), updateContent);

// @desc    Get all admins
// @route   GET /api/admin
// @access  Private/Superadmin
router.get('/', authorize('superadmin'), async (req, res, next) => {
  try {
    let admins;
    try {
      admins = await Admin.find().select('-password');
    } catch (dbError) {
      console.error('[Admin] [getAllAdmins] Database error:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve admins'
      });
    }
    
    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single admin
// @route   GET /api/admin/:id
// @access  Private/Superadmin
router.get('/:id', authorize('superadmin'), async (req, res, next) => {
  try {
    if (!req.params.id) {
      console.warn('[Admin] [getAdmin] Missing admin ID');
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required'
      });
    }

    let admin;
    try {
      admin = await Admin.findById(req.params.id).select('-password');
    } catch (dbError) {
      if (dbError.name === 'CastError') {
        console.warn('[Admin] [getAdmin] Invalid admin ID format');
        return res.status(400).json({
          success: false,
          message: 'Invalid admin ID format'
        });
      }
      console.error('[Admin] [getAdmin] Database error:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve admin'
      });
    }
    
    if (!admin) {
      console.warn('[Admin] [getAdmin] Admin not found');
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update admin
// @route   PUT /api/admin/:id
// @access  Private/Superadmin
router.put('/:id', authorize('superadmin'), async (req, res, next) => {
  try {
    if (!req.params.id) {
      console.warn('[Admin] [updateAdmin] Missing admin ID');
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required'
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      console.warn('[Admin] [updateAdmin] Empty request body');
      return res.status(400).json({
        success: false,
        message: 'Update data is required'
      });
    }

    const { email, role, isActive } = req.body;

    // Validate role if provided
    if (role && !['admin', 'superadmin'].includes(role)) {
      console.warn('[Admin] [updateAdmin] Invalid role:', role);
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin or superadmin'
      });
    }

    let admin;
    try {
      admin = await Admin.findById(req.params.id);
    } catch (dbError) {
      if (dbError.name === 'CastError') {
        console.warn('[Admin] [updateAdmin] Invalid admin ID format');
        return res.status(400).json({
          success: false,
          message: 'Invalid admin ID format'
        });
      }
      console.error('[Admin] [updateAdmin] Database error:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve admin'
      });
    }

    if (!admin) {
      console.warn('[Admin] [updateAdmin] Admin not found');
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Update fields
    if (email) admin.email = email;
    if (role) admin.role = role;
    if (isActive !== undefined) admin.isActive = isActive;

    // Save with error handling
    try {
      await admin.save();
    } catch (saveError) {
      console.error('[Admin] [updateAdmin] Failed to save admin:', saveError.message);
      if (saveError.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid admin data'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to update admin'
      });
    }

    console.info('[Admin] [updateAdmin] Admin updated:', admin._id);
    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete admin
// @route   DELETE /api/admin/:id
// @access  Private/Superadmin
router.delete('/:id', authorize('superadmin'), async (req, res, next) => {
  try {
    if (!req.params.id) {
      console.warn('[Admin] [deleteAdmin] Missing admin ID');
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required'
      });
    }

    let admin;
    try {
      admin = await Admin.findById(req.params.id);
    } catch (dbError) {
      if (dbError.name === 'CastError') {
        console.warn('[Admin] [deleteAdmin] Invalid admin ID format');
        return res.status(400).json({
          success: false,
          message: 'Invalid admin ID format'
        });
      }
      console.error('[Admin] [deleteAdmin] Database error:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve admin'
      });
    }

    if (!admin) {
      console.warn('[Admin] [deleteAdmin] Admin not found');
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent deleting self
    if (admin._id.toString() === req.admin.id) {
      console.warn('[Admin] [deleteAdmin] Admin attempted self-delete');
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete with error handling
    try {
      await admin.deleteOne();
    } catch (deleteError) {
      console.error('[Admin] [deleteAdmin] Failed to delete admin:', deleteError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete admin'
      });
    }

    console.info('[Admin] [deleteAdmin] Admin deleted:', admin._id);
    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
