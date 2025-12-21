# Error Logging Standards

This document outlines the standardized error logging practices for the Tea Shop application across both backend and frontend.

## Overview

Error logging has been standardized across the entire stack to ensure:
- **Consistent Context**: All errors logged with route, user, and action information
- **Security**: Sensitive data (passwords, tokens, API keys) are never logged
- **Traceability**: Errors include enough context for debugging without exposing user data
- **Reliability**: Keepalive fetch ensures error logs reach the server even on page unload

## Backend Error Logging

### Logger Utility Location
```
server/src/utils/logger.js
```

### Available Functions

#### `logError(req, action, error, additionalContext = {})`
Log critical errors that need investigation.

**Parameters:**
- `req` - Express request object
- `action` - Human-readable action name (e.g., 'create-item', 'database-connection')
- `error` - Error object or string message
- `additionalContext` - Optional additional context object

**Example:**
```javascript
import { logError } from '../utils/logger.js';

try {
  // Database operation
} catch (error) {
  logError(req, 'create-item', error, { itemId: item.id });
  res.status(500).json({ success: false, message: 'Failed to create item' });
}
```

#### `logWarn(req, action, message, additionalContext = {})`
Log warnings (validation errors, invalid requests, etc.)

**Example:**
```javascript
import { logWarn } from '../utils/logger.js';

if (!isValidEmail(email)) {
  logWarn(req, 'invalid-email', 'Email validation failed', { email });
  res.status(400).json({ success: false, message: 'Invalid email' });
}
```

#### `logInfo(req, action, message, additionalContext = {})`
Log informational messages (successful operations, important events)

**Example:**
```javascript
import { logInfo } from '../utils/logger.js';

logInfo(req, 'user-login', 'User successfully logged in', { userId: user.id });
```

#### `logSuccess(req, action, message, additionalContext = {})`
Log successful operations

**Example:**
```javascript
import { logSuccess } from '../utils/logger.js';

logSuccess(req, 'item-created', 'Item successfully created', { itemId: item.id });
```

### Automatic Context Building

The logger automatically builds context from the request:
- `method` - HTTP method (GET, POST, etc.)
- `path` - Request path
- `userId` - User ID (if authenticated)
- `userEmail` - User email (if authenticated)
- `ip` - Client IP address
- `timestamp` - ISO timestamp

**Example output:**
```
[POST] [/api/items] [create-item] - {
  timestamp: '2024-01-15T10:30:45.123Z',
  method: 'POST',
  path: '/api/items',
  userId: '507f1f77bcf86cd799439011',
  userEmail: 'user@example.com',
  ip: '192.168.1.1',
  error: { message: 'Database error', code: 'ECONNREFUSED' }
}
```

### Sensitive Data Filtering

The following fields are automatically filtered from all logs:
- `password`
- `token`
- `secret`
- `apiKey`
- `authorization`

**Example:**
```javascript
// This will log the request, but password will be redacted
logWarn(req, 'login-attempt', 'Login failed', { 
  email: 'user@example.com',
  password: '***[REDACTED]***' // Automatically filtered
});
```

## Frontend Error Logging

### Logger Utility Locations
```
client-web/src/utils/logger.js
admin-web/src/utils/logger.js
```

Note: Both frontends use identical logger utilities.

### Available Functions

#### `logComponentError(source, error)`
Log React component errors caught by ErrorBoundary.

**Parameters:**
- `source` - Component name or error source
- `error` - Error object

**Example:**
```javascript
import { logComponentError } from '../utils/logger';

componentDidCatch(error, errorInfo) {
  logComponentError('AdminDashboard', error);
}
```

#### `logApiError(endpoint, statusCode, error)`
Log API request failures.

**Parameters:**
- `endpoint` - API endpoint URL
- `statusCode` - HTTP status code
- `error` - Error message or object

**Example:**
```javascript
import { logApiError } from '../utils/logger';

try {
  const response = await fetch('/api/items');
  if (!response.ok) {
    logApiError('/api/items', response.status, 'Failed to fetch items');
  }
} catch (error) {
  logApiError('/api/items', 0, error.message);
}
```

#### `logCriticalError(message, errorOrMeta, source)`
Log critical application errors that must be recorded.

**Parameters:**
- `message` - Error message
- `errorOrMeta` - Error object or metadata object
- `source` - Error source (optional, defaults to 'unknown')

**Example:**
```javascript
import { logCriticalError } from '../utils/logger';

try {
  // Critical operation
} catch (error) {
  logCriticalError('Memory allocation failed', error, 'ImageUpload');
}
```

#### `logPromiseRejection(reason)`
Log unhandled promise rejections.

**Parameters:**
- `reason` - Rejection reason (error or any value)

**Example:**
```javascript
// Automatically called in main.jsx
window.addEventListener('unhandledrejection', (event) => {
  logPromiseRejection(event.reason);
});
```

### Error Stack Trace Sanitization

Frontend logger automatically sanitizes error stack traces before sending to server:
- Removes localhost paths and file:// URLs
- Limits stack trace to 500 characters
- Never includes credentials, tokens, or passwords
- Preserves error message and name

**Example:**
```javascript
// Original stack trace:
// Error: Network timeout
//   at fetchData (file:///Users/dev/tea-shop-project/client-web/src/api/items.js:45:12)
//   at processRequest (file:///Users/dev/tea-shop-project/client-web/src/hooks/useItems.js:20:5)

// After sanitization:
// Error: Network timeout
//   at fetchData (items.js:45:12)
//   at processRequest (hooks/useItems.js:20:5)
```

### Server-Side Error Log Endpoint

All frontend errors are sent to: `POST /api/logs`

**Payload structure:**
```javascript
{
  level: 'error|warn|info',
  message: 'Error description',
  source: 'ErrorBoundary|ApiError|ComponentError',
  timestamp: '2024-01-15T10:30:45.123Z',
  userAgent: 'Mozilla/5.0...',
  url: '/admin/items',
  meta: {
    // Sanitized error details, no secrets
    stack: 'Sanitized stack trace',
    statusCode: 500,
    endpoint: '/api/items'
  }
}
```

## Global Error Boundaries

### Frontend Error Boundaries

Both `client-web` and `admin-web` have global ErrorBoundary components that:
- Catch all React component render/lifecycle errors
- Prevent blank screen on component crashes
- Log errors to server via `logComponentError`
- Show user-friendly fallback UI with refresh button

**Location:**
```
client-web/src/components/ErrorBoundary.jsx
admin-web/src/components/ErrorBoundary.jsx
```

**Usage:**
```jsx
// In App.jsx
<ErrorBoundary>
  <Router>
    {/* All routes wrapped */}
  </Router>
</ErrorBoundary>
```

### Backend Error Middleware

Express error middleware in `server/src/middleware/error.js` handles:
- MongoDB validation errors (400)
- Duplicate key errors (409)
- Connection errors (503)
- Authentication errors (500)
- JWT errors (401)
- All other errors (500)

All errors logged with action tag and context using `logError` or `logWarn`.

## What NOT to Log

**Never log:**
- Passwords (plain text or hashed)
- API keys or secret keys
- Authentication tokens or JWTs
- Credit card numbers or payment information
- Personal identification numbers (SSN, passport, etc.)
- User passwords in error messages
- Full stack traces from third-party libraries
- Environment variables containing secrets

**Always redact:**
- Search query parameters that might contain sensitive data
- Request body containing passwords
- Response body containing tokens or credentials

## Logging Best Practices

1. **Use the right function:**
   - `logError` for exceptions and critical failures
   - `logWarn` for validation errors and invalid requests
   - `logInfo` for important informational events
   - `logSuccess` for successful completion of important operations

2. **Include action context:**
   - Use descriptive action names: `create-item`, `update-user`, `delete-template`
   - Action names should indicate what operation was being attempted
   - Makes debugging and log searching much easier

3. **Add relevant context:**
   - Include IDs (user, item, template, etc.) that help identify the problem
   - Don't include sensitive data or full objects
   - Use the `additionalContext` parameter for important context

4. **Error messages should be:**
   - Clear and descriptive
   - Without sensitive data
   - Unique enough to search for
   - Lowercase for consistency (except acronyms like HTTP, ID)

5. **Frontend errors should:**
   - Use `logCriticalError` only for truly critical failures
   - Use `logApiError` for API request failures
   - Include endpoint and status code for API errors
   - Not repeat the same error multiple times (throttle if necessary)

## Debugging with Logs

### Backend Logs
Access logs via server console. Logs include:
- Request method and path
- User who made the request
- Client IP address
- Timestamp
- Action name
- Error details (sanitized)

**Example search pattern:**
```
grep "[POST] [/api/items]" server.log
grep "create-item" server.log
grep "userId: 507f1f77bcf86cd799439011" server.log
```

### Frontend Logs
Frontend errors are sent to `POST /api/logs` endpoint. Create an admin endpoint to view recent errors:
```
GET /api/logs?limit=100&level=error
```

This should return recent error logs with:
- Source (ErrorBoundary, ApiError, etc.)
- Error message
- User's userAgent
- Timestamp
- Affected URL

## Configuration

No special configuration needed. The logger utilities are designed to work out of the box:
- Backend logger automatically extracts context from Express `req` object
- Frontend logger uses browser globals (`navigator`, `window.location`)
- Both avoid external services and use local console/fetch only
- Keepalive fetch ensures logs sent even on page unload

## Testing Error Logging

### Test Backend Logging
```javascript
// In a route handler
throw new Error('Test error');
// Check server console for properly formatted log with context
```

### Test Frontend Logging
```javascript
// In browser console
import { logCriticalError } from './utils/logger';
logCriticalError('Test error', { testData: 'value' }, 'TestSource');
// Check Network tab for POST to /api/logs
```

### Test Global Error Handlers
```javascript
// In browser console - test unhandled error
throw new Error('Test uncaught error');
// Check ErrorBoundary fallback UI or Network tab for error log

// Test unhandled promise rejection
Promise.reject(new Error('Test rejection'));
// Check Network tab for error log
```

## Summary

This standardized error logging approach ensures:
✅ **Traceability**: Every error includes route, user, and action context
✅ **Security**: Sensitive data is never logged
✅ **Reliability**: Errors logged locally and kept in memory if server unavailable
✅ **Consistency**: Same logging patterns across entire application
✅ **Debuggability**: Enough context to identify and fix issues quickly
