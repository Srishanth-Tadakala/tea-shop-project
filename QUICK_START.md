# Quick Start Guide - Tea Shop Admin Dashboard

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 16+ installed
- MongoDB Atlas connection string
- Terminal/command prompt

### Step 1: Install Backend

```bash
cd server
npm install
```

### Step 2: Create .env File

Create `server/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/teashop
JWT_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

### Step 3: Start Backend

```bash
cd server
node src/server.js
```

**Expected output:**
```
=================================
🚀 Server running on port 5000
🌐 API: http://localhost:5000/api
⚡ WebSocket: http://localhost:5000
✅ MongoDB Connected: ...
✅ Default admin created: admin112233@gmail.com
=================================
```

### Step 4: Install & Start Admin Dashboard

In a **new terminal**:

```bash
cd admin-web
npm install
npm run dev
```

**Expected output:**
```
VITE v5.4.21  ready in XXX ms
➜  Local:   http://localhost:5174/
➜  press h + enter to show help
```

### Step 5: Install & Start Client Website

In **another new terminal**:

```bash
cd client-web
npm install
npm run dev
```

**Expected output:**
```
VITE v5.4.21  ready in XXX ms
➜  Local:   http://localhost:5173/
```

## 📋 Terminal Overview

You should now have **3 terminals running**:

| Terminal | Command | URL | Purpose |
|----------|---------|-----|---------|
| 1 | `node src/server.js` | http://localhost:5000 | API & WebSocket |
| 2 | `npm run dev` (admin-web) | http://localhost:5174 | Admin Dashboard |
| 3 | `npm run dev` (client-web) | http://localhost:5173 | Public Website |

## 🔐 Login to Admin Dashboard

1. Open http://localhost:5174
2. You're redirected to `/login`
3. Enter credentials:
   - **Email**: `admin112233@gmail.com`
   - **Password**: `admin@#$12345`
4. Click "Login"
5. ✅ Redirected to `/dashboard`

## 🎮 Test Admin Features

### Dashboard (`/dashboard`)
- View shop stats
- Toggle shop open/close (real-time update to customer site)
- See last update time

### Items (`/items`)
- Create new tea item
- Edit existing items
- Delete items
- Upload images
- See changes instantly on customer site via Socket.IO

### Library (`/library`)
- Browse item templates
- Add custom templates
- Organize library

### Settings (`/settings`)
- Change admin password
- Update shop hours
- Configure availability

## 🌐 Test Public Website

1. Open http://localhost:5173
2. Browse public pages:
   - Home - Landing page
   - Menu - View all teas (updates in real-time from admin)
   - Ingredients - Ingredient descriptions
   - Location - Shop location
   - Status - Current shop status (updates live)

## 🔄 Test Real-Time Sync

1. Open **admin dashboard** at `/items`
2. Open **public website** at `/menu` (in another window)
3. Create a new tea item in admin dashboard
4. ✅ It appears instantly in the public menu (no page refresh!)
5. Edit the item in admin dashboard
6. ✅ Public menu updates automatically
7. Delete the item
8. ✅ It disappears from public menu

## 📱 Mobile Testing

```bash
# Get your local IP
ipconfig getifaddr en0  # Mac
ipconfig              # Windows

# Open on phone on same network
http://<YOUR_IP>:5173   # Public site
http://<YOUR_IP>:5174   # Admin dashboard
```

## 🛑 Stopping the Servers

Press `Ctrl+C` in each terminal to stop:
1. Admin dashboard server
2. Client website server
3. Backend API server

## ⚠️ Common Issues

### "Port 5000 already in use"
```bash
# Kill existing process on port 5000
lsof -ti:5000 | xargs kill -9  # Mac
netstat -ano | findstr :5000   # Windows
```

### "Cannot connect to MongoDB"
- [ ] Check MONGODB_URI in `.env`
- [ ] Verify IP whitelist in MongoDB Atlas
- [ ] Test connection in MongoDB Compass

### "Admin login fails"
- [ ] Backend server running?
- [ ] Check server console for errors
- [ ] Is default admin seeded? (check logs)

### "Real-time updates not working"
- [ ] Backend WebSocket enabled?
- [ ] Browser console shows Socket.IO connect?
- [ ] Check network tab for WebSocket upgrade

## 🚢 Production Deployment

### Build Admin Dashboard
```bash
cd admin-web
npm run build
# Output: admin-web/dist/
```

### Build Client Website
```bash
cd client-web
npm run build
# Output: client-web/dist/
```

### Deploy to Hosting

**Admin Dashboard:**
- Upload `admin-web/dist/` to hosting provider
- Configure domain: `admin.amruthulya.com`
- Set environment: `VITE_API_URL=https://api.amruthulya.com`

**Public Website:**
- Upload `client-web/dist/` to hosting provider
- Configure domain: `amruthulya.com`
- Set environment: `VITE_API_URL=https://api.amruthulya.com`

**Backend:**
- Deploy to cloud (Heroku, AWS, DigitalOcean, etc.)
- Set `CLIENT_URL` to point to production domains
- Update MongoDB IP whitelist with server IP

## 📚 Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Admin Setup Details](./ADMIN_SETUP.md)
- [Backend API Docs](./server/README.md)

## 🆘 Need Help?

### Check Logs

```bash
# Backend errors
# Check server terminal output

# Frontend errors
# Open DevTools (F12) → Console tab

# API errors
# DevTools → Network tab → XHR
```

### Reset Everything

```bash
# Clear all node modules
rm -rf node_modules server/node_modules admin-web/node_modules client-web/node_modules

# Reinstall
cd server && npm install
cd ../admin-web && npm install
cd ../client-web && npm install
```

## ✅ Success Checklist

- [ ] Backend running on http://localhost:5000
- [ ] Admin dashboard running on http://localhost:5174
- [ ] Public website running on http://localhost:5173
- [ ] Can login with `admin112233@gmail.com / admin@#$12345`
- [ ] Can see real-time updates between admin and public site
- [ ] Toasts/notifications appearing
- [ ] No console errors in browser
- [ ] No errors in server terminal

**If all checked:** 🎉 You're ready to start developing!

---

**Next:** Read [ARCHITECTURE.md](./ARCHITECTURE.md) for project structure overview.
