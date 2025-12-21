import Admin from '../models/Admin.js';
import { sendTokenResponse } from '../utils/jwt.js';

// @desc    Register new admin
// @route   POST /api/auth/register
// @access  Public (but should be restricted in production)
export const register = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Validation
    if (!email || !password) {
      console.warn('[Auth] [register] Missing required fields');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email and password are required',
          code: 'validation_error'
        }
      });
    }

    if (password.length < 6) {
      console.warn('[Auth] [register] Password too short');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password must be at least 6 characters',
          code: 'validation_error'
        }
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.warn('[Auth] [register] Duplicate email attempt');
      return res.status(409).json({
        success: false,
        error: {
          message: 'Email already registered',
          code: 'duplicate_email'
        }
      });
    }

    // Create admin
    let admin;
    try {
      admin = await Admin.create({
        email,
        password,
        role: role || 'admin'
      });
    } catch (createError) {
      console.error('[Auth] [register] Creation failed:', createError.message);
      if (createError.code === 11000) {
        return res.status(409).json({
          success: false,
          error: {
            message: 'Email already registered',
            code: 'duplicate_email'
          }
        });
      }
      throw createError;
    }

    console.info('[Auth] [register] New admin registered');
    // Send token response
    sendTokenResponse(admin, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      console.warn('[Auth] [login] Missing required fields');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email and password are required',
          code: 'validation_error'
        }
      });
    }

    // Check for admin (include password for verification)
    let admin;
    try {
      admin = await Admin.findOne({ email }).select('+password');
    } catch (dbError) {
      console.error('[Auth] [login] Database error:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Authentication service temporarily unavailable'
      });
    }

    if (!admin) {
      console.warn('[Auth] [login] Admin not found');
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password',
          code: 'invalid_credentials'
        }
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      console.warn('[Auth] [login] Inactive admin attempted login');
      return res.status(403).json({
        success: false,
        error: {
          message: 'Account has been disabled. Contact administrator.',
          code: 'auth_inactive'
        }
      });
    }

    // Check if password matches
    let isMatch;
    try {
      isMatch = await admin.matchPassword(password);
    } catch (matchError) {
      console.error('[Auth] [login] Password comparison failed:', matchError.message);
      return res.status(500).json({
        success: false,
        message: 'Authentication service temporarily unavailable'
      });
    }

    if (!isMatch) {
      console.warn('[Auth] [login] Invalid password');
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password',
          code: 'invalid_credentials'
        }
      });
    }

    // Update last login
    try {
      admin.lastLogin = Date.now();
      await admin.save({ validateBeforeSave: false });
    } catch (saveError) {
      console.error('[Auth] [login] Failed to update lastLogin:', saveError.message);
      // Don't fail login for this non-critical update
    }

    console.info('[Auth] [login] Admin logged in successfully');
    // Send token response
    sendTokenResponse(admin, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in admin
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    if (!req.admin || !req.admin.id) {
      console.warn('[Auth] [getMe] No admin context in request');
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'auth_required'
        }
      });
    }

    let admin;
    try {
      admin = await Admin.findById(req.admin.id);
    } catch (dbError) {
      console.error('[Auth] [getMe] Database error:', dbError.message);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to retrieve account information',
          code: 'db_error'
        }
      });
    }

    if (!admin) {
      console.warn('[Auth] [getMe] Admin not found');
      return res.status(401).json({
        success: false,
        error: {
          message: 'Your account no longer exists',
          code: 'auth_missing_account'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout admin / clear cookie
// @route   GET /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update admin password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      console.warn('[Auth] [updatePassword] Missing required fields');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Current and new passwords are required',
          code: 'validation_error'
        }
      });
    }

    if (newPassword.length < 6) {
      console.warn('[Auth] [updatePassword] Password too short');
      return res.status(400).json({
        success: false,
        error: {
          message: 'New password must be at least 6 characters',
          code: 'validation_error'
        }
      });
    }

    if (currentPassword === newPassword) {
      console.warn('[Auth] [updatePassword] New password same as current');
      return res.status(400).json({
        success: false,
        error: {
          message: 'New password must be different from current password',
          code: 'validation_error'
        }
      });
    }

    // Retrieve admin
    let admin;
    try {
      admin = await Admin.findById(req.admin.id).select('+password');
    } catch (dbError) {
      console.error('[Auth] [updatePassword] Database error:', dbError.message);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to retrieve account information',
          code: 'db_error'
        }
      });
    }

    if (!admin) {
      console.warn('[Auth] [updatePassword] Admin not found');
      return res.status(401).json({
        success: false,
        error: {
          message: 'Your account no longer exists',
          code: 'auth_missing_account'
        }
      });
    }

    // Check current password
    let isMatch;
    try {
      isMatch = await admin.matchPassword(currentPassword);
    } catch (matchError) {
      console.error('[Auth] [updatePassword] Password comparison failed:', matchError.message);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Password verification failed',
          code: 'auth_error'
        }
      });
    }

    if (!isMatch) {
      console.warn('[Auth] [updatePassword] Invalid current password');
      return res.status(401).json({
        success: false,
        error: {
          message: 'Current password is incorrect',
          code: 'invalid_credentials'
        }
      });
    }

    // Update password
    try {
      admin.password = newPassword;
      await admin.save();
    } catch (saveError) {
      console.error('[Auth] [updatePassword] Failed to save new password:', saveError.message);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update password',
          code: 'db_error'
        }
      });
    }

    console.info('[Auth] [updatePassword] Password updated successfully');
    sendTokenResponse(admin, 200, res);
  } catch (error) {
    next(error);
  }
};
