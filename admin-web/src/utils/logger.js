/**
 * Frontend Error Logging Utility
 * Sends critical errors to /api/logs
 * Includes minimal metadata only
 */

const CRITICAL_ERROR_TYPES = [
  'TypeError',
  'ReferenceError',
  'SyntaxError',
  'RangeError',
  'Error',
];

/**
 * Sanitize error info for logging
 * Remove sensitive data from stack traces
 */
const sanitizeErrorInfo = (error) => {
  if (!error) return null;

  const sanitized = {
    message: error?.message || String(error),
    name: error?.name || 'Error',
    stack: error?.stack || '',
  };

  // Remove sensitive paths from stack
  if (sanitized.stack) {
    sanitized.stack = sanitized.stack
      .split('\n')
      .filter(line => !line.includes('localhost:') && !line.includes('127.0.0.1'))
      .join('\n')
      .substring(0, 500); // Limit stack size
  }

  return sanitized;
};

/**
 * Log critical error to backend
 */
export const logCriticalError = (message, errorOrMeta = {}, source = 'unknown') => {
  try {
    let meta = {};

    if (errorOrMeta instanceof Error) {
      meta.error = sanitizeErrorInfo(errorOrMeta);
    } else {
      meta = errorOrMeta;
    }

    // Add minimal metadata
    const payload = {
      level: 'error',
      message: message || 'Frontend critical error',
      source,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.pathname,
      meta: {
        ...meta,
        // Never include sensitive info
        credentials: undefined,
        authorization: undefined,
        password: undefined,
        token: undefined,
      },
    };

    // Send to server with keepalive to ensure delivery
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((err) => {
      // Silent fail - don't log logging failures to avoid loops
      console.debug('[Logger] Failed to send error log:', err?.message);
    });
  } catch (err) {
    // Prevent infinite loops if logging itself crashes
    console.debug('[Logger] Error logging error:', err?.message);
  }
};

/**
 * Log component render error
 */
export const logComponentError = (component, error) => {
  logCriticalError(
    `Component render error: ${component}`,
    { error, component },
    'component-error'
  );
};

/**
 * Log API request error
 */
export const logApiError = (endpoint, status, error) => {
  logCriticalError(
    `API request failed: ${endpoint} (${status})`,
    { error: error?.message, endpoint, status },
    'api-error'
  );
};

/**
 * Log unhandled promise rejection
 */
export const logPromiseRejection = (reason) => {
  logCriticalError(
    'Unhandled promise rejection',
    { reason: typeof reason === 'object' ? reason : String(reason) },
    'promise-rejection'
  );
};

export default {
  logCriticalError,
  logComponentError,
  logApiError,
  logPromiseRejection,
};
