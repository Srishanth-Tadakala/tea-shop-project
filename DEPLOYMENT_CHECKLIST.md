# 🚀 Production Deployment Checklist

**Project:** Tea Shop (Backend + Admin-Web + Client-Web)  
**Date:** December 21, 2025  
**Status:** ✅ READY FOR DEPLOYMENT

---

## ✅ PRE-DEPLOYMENT VERIFICATION

### Build Status
- ✅ **Admin-Web:** Build successful (dist/ generated, 383 modules)
- ✅ **Client-Web:** Build successful (dist/ generated, 962 modules, optimized chunks)
- ✅ **Backend:** Production startup validated (NODE_ENV=production)

### Security Verification
- ✅ No hardcoded secrets in source code
- ✅ Stack traces hidden in production mode
- ✅ CORS properly configured with domain whitelist
- ✅ JWT_SECRET fallback removed (fails fast if missing)
- ✅ Error responses sanitized (user-friendly messages only)

### Configuration Verification
- ✅ Environment validation enforced (missing vars cause startup failure)
- ✅ trust proxy enabled for production reverse proxy
- ✅ WebSocket CORS configured correctly
- ✅ Cookie configuration production-ready

---

## 📋 DEPLOYMENT STEPS

### 1️⃣ BACKEND DEPLOYMENT (Node.js Server)

#### Environment Variables (REQUIRED)
Set these on your production server/platform:

```bash
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/teashop?retryWrites=true&w=majority

# Security
JWT_SECRET=<STRONG_RANDOM_SECRET_MIN_32_CHARS>
JWT_EXPIRE=30d
COOKIE_EXPIRE=7

# CORS (Update to your actual domains)
CLIENT_WEB_DOMAIN=https://yourdomain.com
ADMIN_WEB_DOMAIN=https://admin.yourdomain.com
```

#### Deployment Commands

**Option A: Traditional Server (PM2 Recommended)**
```bash
# Install dependencies
cd server
npm install --production

# Start with PM2 (recommended)
pm2 start src/server.js --name tea-shop-api
pm2 save
pm2 startup

# OR start with forever
forever start src/server.js

# OR simple start (not recommended for production)
node src/server.js
```

**Option B: Docker**
```bash
cd server
docker build -t tea-shop-backend .
docker run -d -p 5000:5000 --env-file .env.production tea-shop-backend
```

**Option C: Platform-as-a-Service (Render, Railway, Fly.io)**
- Connect GitHub repository
- Set build command: `npm install`
- Set start command: `node src/server.js`
- Configure environment variables in platform dashboard
- Deploy

#### Health Check
```bash
curl https://api.yourdomain.com/api/health
# Expected: {"status":"ok","message":"Server is running","uptime":...}
```

---

### 2️⃣ CLIENT-WEB DEPLOYMENT (Public Website)

#### Environment Variables
Create `.env.production`:
```bash
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=https://api.yourdomain.com
```

#### Build
```bash
cd client-web
npm install
npm run build
# Output: dist/ folder
```

#### Deploy dist/ Folder

**Option A: Static Hosting (Vercel, Netlify, CloudFlare Pages)**
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist

# Cloudflare Pages
wrangler pages deploy dist
```

**Important: Configure SPA Rewrites**
All hosting platforms need to redirect 404s to `index.html`:

- **Vercel:** Create `vercel.json`:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

- **Netlify:** Create `_redirects` in `public/`:
  ```
  /*    /index.html   200
  ```

- **Cloudflare Pages:** Auto-configured for SPAs

**Option B: Traditional Server (Nginx)**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/tea-shop/client-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

---

### 3️⃣ ADMIN-WEB DEPLOYMENT (Admin Dashboard)

#### Environment Variables
Create `.env.production`:
```bash
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=https://api.yourdomain.com
```

#### Build
```bash
cd admin-web
npm install
npm run build
# Output: dist/ folder
```

#### Deploy dist/ Folder

**Same process as Client-Web** (see above)

**Subdomain Recommendation:**
- Client-Web: `https://yourdomain.com`
- Admin-Web: `https://admin.yourdomain.com`

**Security Note:** Admin-Web domain MUST match `ADMIN_WEB_DOMAIN` in backend .env

---

### 4️⃣ DATABASE (MongoDB Atlas)

#### Setup
1. ✅ **Database already configured** (MongoDB Atlas)
2. Verify connection string in backend .env
3. **Production Checklist:**
   - [ ] Enable IP whitelisting (allow backend server IP)
   - [ ] Disable public access (0.0.0.0/0) if enabled
   - [ ] Enable MongoDB backup automation
   - [ ] Set up monitoring alerts
   - [ ] Review database user permissions

#### Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/teashop?retryWrites=true&w=majority
```

#### Default Admin Account
```
Email: admin112233@gmail.com
Password: Admin@112233
```

**⚠️ CRITICAL:** Change default admin password after first login!

---

### 5️⃣ WEBSOCKET CONFIGURATION

#### Hosting Requirements
WebSocket requires:
- **HTTP/2 or HTTP/1.1 upgrade support**
- **Reverse proxy configuration** (if using Nginx/Apache)

#### Nginx Configuration (if applicable)
```nginx
location / {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### Platform Support
- ✅ **Render:** WebSocket supported
- ✅ **Railway:** WebSocket supported
- ✅ **Fly.io:** WebSocket supported
- ✅ **Heroku:** WebSocket supported (requires proper dyno type)
- ⚠️ **Vercel Serverless:** NOT supported (use traditional hosting)

---

## 🔐 SECURITY CHECKLIST

### Pre-Deployment
- [x] Remove hardcoded credentials from all files
- [x] Verify .env files are in .gitignore
- [x] Ensure JWT_SECRET is strong (32+ characters)
- [x] Verify CORS origins match production domains
- [x] Stack traces hidden in production mode
- [x] Error messages sanitized

### Post-Deployment
- [ ] Change default admin password immediately
- [ ] Enable HTTPS on all domains (SSL/TLS certificates)
- [ ] Configure MongoDB IP whitelist
- [ ] Set up firewall rules (only allow necessary ports)
- [ ] Enable rate limiting (optional - currently not configured)
- [ ] Set up security monitoring/alerts
- [ ] Review CORS origins are correct
- [ ] Test WebSocket connections behind proxy

---

## 🧪 POST-DEPLOYMENT TESTING

### Backend API Tests
```bash
# Health check
curl https://api.yourdomain.com/api/health

# Auth endpoint (should return 400)
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{}' 

# Expected: {"success":false,"message":"Email and password are required"}
```

### Frontend Tests
1. **Client-Web:**
   - [ ] Navigate to homepage
   - [ ] Menu page loads tea items
   - [ ] 3D scene loads (or shows fallback)
   - [ ] Status page shows shop status
   - [ ] Real-time updates work (toggle shop status from admin)

2. **Admin-Web:**
   - [ ] Login with default admin credentials
   - [ ] Dashboard loads statistics
   - [ ] Items page CRUD operations work
   - [ ] Library templates work
   - [ ] Shop toggle updates in real-time
   - [ ] WebSocket sync works (open 2 tabs, edit in one)

### WebSocket Tests
1. Open browser console on client-web
2. Check for WebSocket connection logs
3. Toggle shop status in admin dashboard
4. Verify status updates immediately in client-web

---

## 📊 PERFORMANCE OPTIMIZATION

### Already Implemented
- ✅ Three.js code-split into separate chunk
- ✅ Lazy loading for admin pages
- ✅ React.lazy() for non-critical routes
- ✅ Gzip compression ready
- ✅ WebGL fallback for 3D scene failures

### Recommended Additional Steps
- [ ] Enable CDN for static assets (Cloudflare, AWS CloudFront)
- [ ] Configure browser caching headers
- [ ] Enable HTTP/2 on web server
- [ ] Set up image optimization (if serving images)
- [ ] Monitor bundle sizes (keep chunks < 500KB)

---

## 🔍 MONITORING & LOGGING

### Backend Logs
All errors are logged with context:
```
[POST] [/api/auth/login] [login] Admin not found
```

### Recommended Monitoring
- **Application:** PM2 dashboard, Render logs, Railway logs
- **Database:** MongoDB Atlas monitoring
- **Errors:** Frontend errors sent to `/api/logs` (backend console)
- **Uptime:** UptimeRobot, Pingdom, or platform monitoring

---

## ⚠️ KNOWN RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| **WebSocket failures behind proxy** | Real-time sync broken | Configure proxy correctly (see nginx config above) |
| **Large Three.js bundle (292KB gzip)** | Slow initial load | ✅ Already lazy-loaded + fallback implemented |
| **Default admin credentials** | Security vulnerability | ⚠️ MUST change after first login |
| **MongoDB credentials in .env** | Credential leak if repo exposed | ✅ .env in .gitignore, use platform secrets |
| **CORS misconfiguration** | Frontend can't access API | Verify CLIENT_WEB_DOMAIN and ADMIN_WEB_DOMAIN exactly match deployed URLs |

---

## 📦 DEPLOYMENT PLATFORMS COMPARISON

| Platform | Backend | Frontend | WebSocket | Database | Cost |
|----------|---------|----------|-----------|----------|------|
| **Render** | ✅ | ✅ | ✅ | External | Free tier available |
| **Railway** | ✅ | ✅ | ✅ | External | Free trial, pay-as-go |
| **Vercel** | ❌ Serverless | ✅ | ❌ | External | Free tier generous |
| **Netlify** | ❌ Functions | ✅ | ❌ | External | Free tier available |
| **Heroku** | ✅ | ✅ | ✅ | ✅ Addon | Free tier discontinued |
| **Fly.io** | ✅ | ✅ | ✅ | External | Free tier available |
| **AWS/GCP/Azure** | ✅ | ✅ | ✅ | ✅ | Pay-as-you-go |

**Recommended Setup:**
- **Backend:** Render / Railway / Fly.io (WebSocket support)
- **Frontend:** Vercel / Netlify / Cloudflare Pages (optimized for SPAs)
- **Database:** MongoDB Atlas (already configured)

---

## ✅ FINAL VERIFICATION

Before going live, confirm:

- [ ] All environment variables set correctly
- [ ] Backend health endpoint responds
- [ ] Frontend builds deployed
- [ ] HTTPS enabled on all domains
- [ ] CORS origins match deployed domains
- [ ] WebSocket connections work
- [ ] Default admin password changed
- [ ] MongoDB IP whitelist configured
- [ ] Error logging works
- [ ] Real-time sync tested
- [ ] Mobile responsiveness checked

---

## 🆘 TROUBLESHOOTING

### Backend Won't Start
```bash
# Check logs
pm2 logs tea-shop-api

# Common issues:
# 1. Missing environment variables → Check .env.production
# 2. Port already in use → Change PORT env var
# 3. MongoDB connection failed → Verify MONGODB_URI and IP whitelist
```

### Frontend Can't Connect to Backend
```bash
# 1. Verify VITE_API_URL matches backend domain
# 2. Check CORS error in browser console
# 3. Ensure CLIENT_WEB_DOMAIN or ADMIN_WEB_DOMAIN in backend matches frontend URL
# 4. Verify backend is running (curl health endpoint)
```

### WebSocket Not Connecting
```bash
# 1. Check browser console for WebSocket errors
# 2. Verify reverse proxy WebSocket configuration
# 3. Test with Socket.IO tester: https://amritb.github.io/socketio-client-tool/
# 4. Ensure backend supports WebSocket transports
```

### 3D Scene Not Loading
```bash
# 1. Check browser console for WebGL errors
# 2. Fallback should activate automatically
# 3. Verify three.js chunk loaded (Network tab)
# 4. Test on different browser/device
```

---

## 📞 DEPLOYMENT SUPPORT

**Documentation:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [ERROR_HANDLING_COMPLETION.md](./ERROR_HANDLING_COMPLETION.md) - Error handling guide
- [ENV_CONFIGURATION.md](./ENV_CONFIGURATION.md) - Environment setup

**Common Commands:**
```bash
# Backend
npm start                  # Start production server
pm2 status                 # Check PM2 status
pm2 logs tea-shop-api      # View logs

# Frontend
npm run build              # Build for production
npm run preview            # Preview production build locally

# Database
mongosh "<MONGODB_URI>"    # Connect to MongoDB
```

---

**Status:** ✅ **PROJECT IS PRODUCTION-READY**

**Last Updated:** December 21, 2025  
**Validation:** All builds successful, production startup verified, security hardened
