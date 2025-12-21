# Environment Configuration Guide

## Overview

Both **client-web** and **admin-web** use Vite environment variables to configure API and WebSocket URLs. This allows them to:
- Point to the **same backend** in all environments
- Be deployed **independently**
- Support **development, staging, and production** environments

## Environment Variables

### Required Variables

Both apps require these two variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | REST API base URL | `http://localhost:5000` |
| `VITE_WS_URL` | WebSocket URL for Socket.IO | `http://localhost:5000` |

⚠️ **IMPORTANT**: Do NOT include `/api` suffix in `VITE_API_URL` - the app adds it automatically.

## Environment Files

### File Hierarchy

Vite loads environment files in this order (last wins):

1. `.env` - Loaded in all environments
2. `.env.local` - Local overrides (git-ignored)
3. `.env.[mode]` - Mode-specific (e.g., `.env.production`)
4. `.env.[mode].local` - Mode-specific local overrides

### Setup Instructions

#### Development

**client-web/.env:**
```dotenv
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
```

**admin-web/.env:**
```dotenv
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
```

✅ Run: `npm run dev` (uses default `.env`)

#### Staging

**client-web/.env.staging:**
```dotenv
VITE_API_URL=https://api-staging.amruthulya.com
VITE_WS_URL=https://api-staging.amruthulya.com
```

**admin-web/.env.staging:**
```dotenv
VITE_API_URL=https://api-staging.amruthulya.com
VITE_WS_URL=https://api-staging.amruthulya.com
```

✅ Run: `npm run build -- --mode staging`

#### Production

**client-web/.env.production:**
```dotenv
VITE_API_URL=https://api.amruthulya.com
VITE_WS_URL=https://api.amruthulya.com
```

**admin-web/.env.production:**
```dotenv
VITE_API_URL=https://api.amruthulya.com
VITE_WS_URL=https://api.amruthulya.com
```

✅ Run: `npm run build` (uses `.env.production`)

## Current Configuration

### Development (.env)

Both apps are configured to point to the **same backend**:

```
┌─────────────────────────────────────┐
│      Client-Web (5173)              │
│  VITE_API_URL=localhost:5000        │──┐
│  VITE_WS_URL=localhost:5000         │  │
└─────────────────────────────────────┘  │
                                         │
                                      ┌──▼──────────────────────┐
┌─────────────────────────────────────┐  │   Backend (5000)       │
│      Admin-Web (5174)               │  │  ✅ API Routes        │
│  VITE_API_URL=localhost:5000        │──┼──✅ WebSocket         │
│  VITE_WS_URL=localhost:5000         │  │  ✅ MongoDB           │
└─────────────────────────────────────┘  │                       │
                                      └───────────────────────────┘
```

## Usage in Code

### API Calls

The apps use relative paths that work with any `VITE_API_URL`:

```javascript
// Will call: {VITE_API_URL}/api/tea/items
const response = await fetch('/api/tea/items');
```

This works because:
1. **Development**: Vite proxy routes `/api` to backend
2. **Production**: Full domain included in requests

### Socket.IO Connection

```javascript
// Uses VITE_WS_URL directly
const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin;
const socket = io(wsUrl, { withCredentials: true });
```

### Toast/Notifications

Environment-independent, uses localStorage for state.

## Deployment Instructions

### Deploy Client-Web

```bash
cd client-web
npm install
npm run build
# Output: dist/
```

**Before uploading to hosting:**
1. Verify `.env.production` has correct `VITE_API_URL`
2. Run `npm run build -- --mode production`
3. Upload `dist/` folder to hosting provider
4. Point domain to hosting (e.g., amruthulya.com)

### Deploy Admin-Web

```bash
cd admin-web
npm install
npm run build
# Output: dist/
```

**Before uploading to hosting:**
1. Verify `.env.production` has correct `VITE_API_URL`
2. Run `npm run build -- --mode production`
3. Upload `dist/` folder to different hosting provider
4. Point subdomain to hosting (e.g., admin.amruthulya.com)

### Deploy Backend

```bash
cd server
npm install
NODE_ENV=production node src/server.js
```

**Configuration needed:**
1. Set `MONGODB_URI` to production database
2. Set `JWT_SECRET` to strong random string
3. Set `CLIENT_URL` to production client domain
4. Update CORS whitelist:
   ```javascript
   const allowedOrigins = [
     'https://amruthulya.com',
     'https://admin.amruthulya.com'
   ];
   ```

## Verifying Configuration

### Test Development Setup

```bash
# Terminal 1: Backend
cd server && node src/server.js

# Terminal 2: Client-Web
cd client-web && npm run dev

# Terminal 3: Admin-Web
cd admin-web && npm run dev
```

**Checklist:**
- [ ] Backend running on http://localhost:5000
- [ ] Client-Web running on http://localhost:5173
- [ ] Admin-Web running on http://localhost:5174
- [ ] Can see real-time updates (Socket.IO connected)
- [ ] No CORS errors in browser console
- [ ] No "Failed to fetch" errors

### Check Environment Variables

**In browser DevTools Console:**

```javascript
// Client-Web
console.log(import.meta.env.VITE_API_URL);    // http://localhost:5000
console.log(import.meta.env.VITE_WS_URL);     // http://localhost:5000

// Admin-Web (same values)
console.log(import.meta.env.VITE_API_URL);    // http://localhost:5000
console.log(import.meta.env.VITE_WS_URL);     // http://localhost:5000
```

### Check Network Requests

**DevTools → Network tab:**
1. Filter for API requests
2. Should see requests to `http://localhost:5000/api/...`
3. No mixed protocols (HTTP vs HTTPS in same request)

### Check Socket.IO Connection

**DevTools → Network tab:**
1. Filter for WebSocket
2. Should see WebSocket upgrade to `http://localhost:5000/socket.io/`
3. Status: 101 Switching Protocols (success)

## Environment Variables Reference

### Accessing in Code

**Template literals:**
```javascript
const apiUrl = import.meta.env.VITE_API_URL;  // http://localhost:5000
const wsUrl = import.meta.env.VITE_WS_URL;    // http://localhost:5000
```

**With fallback:**
```javascript
const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin;
```

### Vite Built-in Variables

Available without declaring:
```javascript
import.meta.env.MODE              // 'development' or 'production'
import.meta.env.DEV               // true in development
import.meta.env.PROD              // true in production
import.meta.env.SSR               // true if SSR
```

## Troubleshooting

### "Cannot reach backend" (localhost:5000)

**Check:**
1. Is backend running? (`npm run dev` in server/)
2. Is `VITE_API_URL` correct in `.env`?
3. Try accessing directly: http://localhost:5000/api/health

**Fix:**
```bash
# Verify backend is listening
cd server && npm install && node src/server.js
```

### "Real-time updates not working" (Socket.IO fails)

**Check:**
1. Is `VITE_WS_URL` set to same value as `VITE_API_URL`?
2. Check browser DevTools → Network tab for WebSocket
3. Check server logs for Socket.IO errors

**Fix:**
```env
# .env - WebSocket should equal API URL
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000  # ✅ SAME as above
```

### "Mixed content" error (HTTPS/HTTP mismatch)

**Cause:** Client on HTTPS pointing to HTTP backend

**Fix:**
```env
# Production - Use HTTPS for both
VITE_API_URL=https://api.amruthulya.com
VITE_WS_URL=https://api.amruthulya.com
```

### "CORS error" in browser

**Check:**
1. Backend CORS whitelist includes frontend domain
2. `withCredentials: true` in Socket.IO options
3. No typos in domain names

**Fix in server/src/server.js:**
```javascript
const allowedOrigins = [
  'http://localhost:5173',          // client-web dev
  'http://localhost:5174',          // admin-web dev
  'https://amruthulya.com',         // client-web prod
  'https://admin.amruthulya.com'    // admin-web prod
];
```

## Best Practices

✅ **DO:**
- Keep `VITE_API_URL` and `VITE_WS_URL` the same
- Use HTTPS in production for both
- Store sensitive values in `.env.local` (git-ignored)
- Add `.env.local` to `.gitignore`

❌ **DON'T:**
- Commit `.env.local` files with secrets
- Include `/api` in `VITE_API_URL`
- Use different API/WS domains without reason
- Hardcode URLs in components

## Production Checklist

Before deploying to production:

- [ ] `.env.production` has correct URLs
- [ ] Backend CORS whitelist includes frontend domains
- [ ] MongoDB connection string points to production DB
- [ ] JWT_SECRET is a strong random string
- [ ] SSL/TLS certificates are installed
- [ ] Environment variables are NOT committed to git
- [ ] `.env.local` is in `.gitignore`
- [ ] Run `npm run build` to verify build succeeds
- [ ] Test with production URLs before going live
- [ ] Monitor backend logs for errors
- [ ] Verify real-time sync works across domains

## Summary

| Environment | Client-Web URL | Admin-Web URL | Backend URL | API URL |
|---|---|---|---|---|
| Development | localhost:5173 | localhost:5174 | localhost:5000 | http://localhost:5000 |
| Staging | staging.amruthulya.com | admin-staging.amruthulya.com | staging-api.amruthulya.com | https://api-staging.amruthulya.com |
| Production | amruthulya.com | admin.amruthulya.com | api.amruthulya.com | https://api.amruthulya.com |

Both client-web and admin-web share the **same backend** in all environments!
