import jwt from 'jsonwebtoken';

// Generate JWT token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Verify JWT token
export const verifyToken = (token) => {
  if (!token) {
    console.warn('[JWT] [verifyToken] Empty token provided');
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn('[JWT] [verifyToken] Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.warn('[JWT] [verifyToken] Invalid token signature or format');
    } else {
      console.warn(`[JWT] [verifyToken] JWT verification failed: ${error.name}`);
    }
    return null;
  }
};

// Send token response with cookie
export const sendTokenResponse = (admin, statusCode, res) => {
  const token = generateToken(admin._id);

  const options = {
    expires: new Date(
      Date.now() + (process.env.COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    admin: {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive
    }
  });
};
