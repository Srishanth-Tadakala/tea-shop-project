/**
 * Standardized Logging Utility
 * Logs with context: route, method, user, action
 * Filters out sensitive data
 */

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apiKey', 'authorization'];

/**
 * Filter sensitive data from objects
 */
const filterSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const filtered = Array.isArray(obj) ? [...obj] : { ...obj };
  
  Object.keys(filtered).forEach(key => {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      filtered[key] = '[REDACTED]';
    } else if (typeof filtered[key] === 'object') {
      filtered[key] = filterSensitiveData(filtered[key]);
    }
  });
  
  return filtered;
};

/**
 * Build log context from request
 */
const buildContext = (req, action = '') => {
  return {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    action: action || req.path.split('/').pop(),
    userId: req.admin?._id || 'anonymous',
    userEmail: req.admin?.email || 'N/A',
    ip: req.ip || req.connection.remoteAddress,
  };
};

/**
 * Log error with context
 */
export const logError = (req, action, error, additionalContext = {}) => {
  const context = buildContext(req, action);
  const filteredError = {
    message: error?.message || String(error),
    code: error?.code || error?.name,
    statusCode: error?.statusCode || 500,
  };

  console.error(`[${context.method}] [${context.path}] [${action}]`, {
    ...context,
    error: filteredError,
    ...additionalContext,
  });
};

/**
 * Log info with context
 */
export const logInfo = (req, action, message, additionalContext = {}) => {
  const context = buildContext(req, action);

  console.log(`[${context.method}] [${context.path}] [${action}] ${message}`, {
    ...context,
    ...additionalContext,
  });
};

/**
 * Log warning with context
 */
export const logWarn = (req, action, message, additionalContext = {}) => {
  const context = buildContext(req, action);

  console.warn(`[${context.method}] [${context.path}] [${action}] ${message}`, {
    ...context,
    ...additionalContext,
  });
};

/**
 * Log success with context
 */
export const logSuccess = (req, action, message, additionalContext = {}) => {
  const context = buildContext(req, action);

  console.log(`[${context.method}] [${context.path}] [${action}] ✓ ${message}`, {
    ...context,
    ...additionalContext,
  });
};

/**
 * Sanitize request body for logging
 */
export const sanitizeRequest = (body) => {
  return filterSensitiveData(body);
};

export default {
  logError,
  logInfo,
  logWarn,
  logSuccess,
  sanitizeRequest,
  buildContext,
};
