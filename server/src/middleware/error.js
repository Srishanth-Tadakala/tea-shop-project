import { logError, logWarn } from '../utils/logger.js';

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Internal server error';
  let clientMessage = message;
  let logAction = 'error';
  const codeFromErr = err.code || err.name;

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => e.message);
    message = `Validation Error: ${errors.join(', ')}`;
    clientMessage = 'Invalid data provided';
    logAction = 'validation-error';
    logWarn(req, logAction, message);
  }

  // Handle Mongoose duplicate key errors
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `Duplicate key error on field: ${field}`;
    clientMessage = `${field} already exists`;
    logAction = 'duplicate-key';
    logWarn(req, logAction, message);
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
    clientMessage = 'Invalid ID format';
    logAction = 'cast-error';
    logWarn(req, logAction, message);
  }

  // Handle MongoDB connection errors
  else if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    statusCode = 503;
    message = `Database connection error: ${err.message}`;
    clientMessage = 'Database service temporarily unavailable';
    logAction = 'connection-error';
    logError(req, logAction, err);
  }

  // Handle MongoDB authentication errors
  else if (err.name === 'MongoAuthenticationError') {
    statusCode = 500;
    message = `Database authentication failed: ${err.message}`;
    clientMessage = 'Database service error';
    logAction = 'auth-error';
    logError(req, logAction, err);
  }

  // Handle general MongoDB errors
  else if (err.name && err.name.includes('Mongo')) {
    statusCode = 500;
    message = `Database error: ${err.message}`;
    clientMessage = 'Database service error';
    logAction = err.name;
    logError(req, logAction, err);
  }

  // Handle JWT errors (if they escape auth middleware)
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    clientMessage = 'Authentication error';
    logAction = 'jwt-error';
    logWarn(req, logAction, err.message);
  }

  // Handle unexpected errors
  else {
    logAction = `error-${statusCode}`;
    logError(req, logAction, err);
  }

  res.status(statusCode);
  res.json({
    success: false,
    error: {
      message: clientMessage,
      ...(codeFromErr && { code: String(codeFromErr) })
    },
    // Only include stack trace in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
