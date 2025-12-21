# Tea Shop Project Architecture

## Project Structure

```
tea-shop-project/
├── client-web/           # 🛍️ Public Customer Website
│   ├── src/
│   │   ├── App.jsx       # PUBLIC ROUTES ONLY (/, /menu, /ingredients, /location, /status, /about, /contact)
│   │   ├── components/   # Shared UI components
│   │   ├── pages/        # Public pages (Home, Menu, About, Contact, etc.)
│   │   ├── services/     # API calls to backend
│   │   └── utils/        # Helper functions
│   ├── package.json      # name: "tea-shop-client-web", port: 5173
│   └── vite.config.js    # Vite configuration
│
├── admin-web/            # 🔐 Private Admin Dashboard
│   ├── src/
│   │   ├── App.jsx       # ADMIN ROUTES ONLY (/login, /dashboard, /items, /library, /settings)
│   │   ├── components/   # Admin-specific components
│   │   ├── pages/        # Admin pages (AdminLogin, AdminDashboard, etc.)
│   │   ├── services/     # API calls to backend
│   │   └── utils/        # Helper functions
│   ├── package.json      # name: "tea-shop-admin-web", port: 5174
│   └── vite.config.js    # Vite configuration
│
├── server/               # 🖥️ Shared Backend API & WebSocket
│   ├── src/
│   │   ├── server.js     # Express app, Socket.IO setup
│   │   ├── config/       # Database & environment config
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth, error handling, validation
│   │   ├── models/       # MongoDB schemas (Admin, TeaItem, ShopStatus, ItemLibrary)
│   │   ├── routes/       # API route definitions (auth, admin, tea, shop, library)
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Helpers (ensureDefaultAdmin, etc.)
│   │   └── websocket/    # Socket.IO event handlers
│   ├── package.json      # name: "tea-shop-server"
│   └── .env              # MongoDB URI, JWT secret, ports
│
├── shared/               # 📦 Reusable Code Package (for future integration)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js # ApiClient class (GET/POST/PUT/PATCH/DELETE with auth)
│   │   ├── socket/
│   │   │   └── client.js # createSocketConnection(), SocketEvents constants
│   │   ├── config.js     # Centralized API/WS URL configuration
│   │   ├── utils/
│   │   │   └── auth.js   # Token management helpers
│   │   └── index.js      # Barrel export
│   └── package.json      # name: "@teashop/shared"
│
├── client/               # ⚠️ LEGACY (original monolithic frontend - can be removed)
│
└── README.md, ARCHITECTURE.md, etc.
```

## Running the Project

### Development (All 3 servers simultaneously)

```bash
# Terminal 1: Backend (port 5000)
cd server
node src/server.js

# Terminal 2: Client Website (port 5173)
cd client-web
npm run dev

# Terminal 3: Admin Dashboard (port 5174)
cd admin-web
npm run dev
```

**URLs:**
- 🛍️ Client: http://localhost:5173
- 🔐 Admin: http://localhost:5174
- 🖥️ API: http://localhost:5000/api
- ⚡ WebSocket: http://localhost:5000

### Production Build

```bash
# Build client website
cd client-web
npm run build
# Output: client-web/dist/ → Deploy to amruthulya.com

# Build admin dashboard
cd admin-web
npm run build
# Output: admin-web/dist/ → Deploy to admin.amruthulya.com

# Backend (runs as Node server)
cd server
NODE_ENV=production node src/server.js
# Deploy to https://api.amruthulya.com
```

## Key Separation Points

| Aspect | Client-Web | Admin-Web | Server |
|--------|-----------|-----------|--------|
| **Routes** | /, /menu, /ingredients, /location, /status, /about, /contact | /login, /dashboard, /items, /library, /settings | /api/* |
| **Auth** | ❌ None | ✅ JWT (ProtectedRoute) | ✅ JWT validation |
| **Port** | 5173 | 5174 | 5000 |
| **Users** | Public visitors | Admin staff | N/A |
| **Features** | Browse menu, view status, contact | CRUD tea items, manage inventory, settings | All business logic |

## Backend CORS Configuration

Server allows both frontend origins in development and production:

```javascript
const allowedOrigins = [
  'http://localhost:5173',       // client-web dev
  'http://localhost:5174',       // admin-web dev
  'https://amruthulya.com',      // client-web prod
  'https://admin.amruthulya.com' // admin-web prod
];
```

## Database (Single MongoDB Instance)

All apps connect to the same MongoDB cluster:

```javascript
// Models: Admin, TeaItem, ShopStatus, ItemLibrary
// MongoDB URL: process.env.MONGODB_URI
```

### Default Admin Credentials

**Seeded at server startup:**
- Email: `admin112233@gmail.com`
- Password: `admin@#$12345` (bcryptjs hashed, never exposed)

## Real-Time Synchronization

Socket.IO broadcasts 6 events across both apps:

1. `teaItem:created` → When admin adds a new tea
2. `teaItem:updated` → When admin edits a tea
3. `teaItem:deleted` → When admin removes a tea
4. `shopStatus:updated` → When shop opens/closes
5. `items:reset` → When inventory is resynced
6. `admin:action` → General admin activity

**Listeners:**
- `client-web`: Menu, Status page → Real-time updates
- `admin-web`: Dashboard, Items → Real-time CRUD reflection

## API Endpoints (17 Total)

### Public Routes (/api/*)
- `GET /api/tea/items` - Fetch all tea items
- `GET /api/shop/status` - Get shop open/close status
- `POST /api/auth/contact` - Submit contact form

### Admin Routes (Protected by JWT)
- `POST /api/auth/login` - Admin login
- `GET /api/admin/info` - Get admin info
- `POST /api/tea/items` - Create tea
- `PUT /api/tea/items/:id` - Update tea
- `DELETE /api/tea/items/:id` - Delete tea
- `GET /api/library/items` - Fetch library
- `POST /api/library/items` - Add to library
- `DELETE /api/library/items/:id` - Remove from library
- `PUT /api/admin/settings` - Update shop settings
- ... + more health/status endpoints

## No Backend Code Duplication

✅ **Backend is shared** - Single server.js instance serves both frontends
✅ **No duplicate routes** - All endpoints defined once in `/server/src/routes/`
✅ **Single database** - One MongoDB connection shared by both apps
✅ **Single WebSocket** - One Socket.IO instance broadcasts to both frontends
✅ **Clean separation** - Each frontend only imports what it needs

## Next Steps

1. **Deploy client-web/dist** to AWS/Vercel/Netlify (or your hosting)
   - Point domain to: amruthulya.com

2. **Deploy admin-web/dist** to separate hosting
   - Point subdomain to: admin.amruthulya.com

3. **Deploy server** to cloud (Heroku, AWS Lambda, DigitalOcean, etc.)
   - Set CORS_ORIGIN environment variables
   - Ensure MongoDB Atlas IP whitelist allows server IP

4. **(Optional) Integrate shared/ package**
   - Currently created but not imported
   - Can be used later for consistency across both frontends
