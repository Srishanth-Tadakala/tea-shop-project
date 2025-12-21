import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  let token;

  // Check for token in headers or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Check if token exists
  if (!token) {
    console.warn(`[Auth] [protect] Missing token from origin: ${req.get('origin') || 'unknown'}`);
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication token required',
        code: 'auth_missing'
      }
    });
  }

  try {
    // Verify token with explicit error handling
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        console.warn(`[Auth] [protect] Expired token used`);
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication token has expired',
            code: 'token_expired'
          }
        });
      } else if (jwtError.name === 'JsonWebTokenError' || jwtError.name === 'SyntaxError') {
        console.warn(`[Auth] [protect] Invalid token format or signature`);
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication token is invalid',
            code: 'token_invalid'
          }
        });
      } else {
        console.error(`[Auth] [protect] JWT Error: ${jwtError.name}`);
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication failed',
            code: 'auth_failed'
          }
        });
      }
    }

    // Get admin from token
    let admin;
    try {
      admin = await Admin.findById(decoded.id).select('-password');
    } catch (dbError) {
      console.error(`[Auth] [protect] Database error during admin lookup: ${dbError.message}`);
      return res.status(500).json({
        success: false,
        message: 'Authentication service temporarily unavailable'
      });
    }

    if (!admin) {
      console.warn(`[Auth] [protect] Admin not found for token ID`);
      return res.status(401).json({
        success: false,
        error: {
          message: 'Your account no longer exists',
          code: 'auth_missing_account'
        }
      });
    }

    if (!admin.isActive) {
      console.warn(`[Auth] [protect] Inactive admin attempted access`);
      return res.status(403).json({
        success: false,
        error: {
          message: 'Your account has been disabled',
          code: 'auth_inactive'
        }
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error(`[Auth] [protect] Unexpected error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Authentication service temporarily unavailable'
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      console.warn(`[Auth] [authorize] No admin context available`);
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'auth_required'
        }
      });
    }

    if (!roles.includes(req.admin.role)) {
      console.warn(`[Auth] [authorize] Unauthorized role attempt: ${req.admin.role} on ${req.method} ${req.path}`);
      return res.status(403).json({
        success: false,
        error: {
          message: 'You do not have permission to access this resource',
          code: 'forbidden'
        }
      });
    }
    next();
  };
};
