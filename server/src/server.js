import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/database.js';
import { errorHandler } from './middleware/error.js';
import { setupWebSocket } from './websocket/handlers.js';
import { ensureDefaultAdmin } from './utils/ensureDefaultAdmin.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import teaRoutes from './routes/teaRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import contentRoutes from './routes/contentRoutes.js';

// Load environment variables
dotenv.config();

const validateEnv = () => {
  const requiredKeys = ['NODE_ENV', 'PORT', 'MONGODB_URI', 'JWT_SECRET', 'CLIENT_WEB_DOMAIN', 'ADMIN_WEB_DOMAIN'];
  const missing = requiredKeys.filter((key) => !process.env[key] || !String(process.env[key]).trim());

  if (missing.length) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const nodeEnv = process.env.NODE_ENV;
  if (!['production', 'development', 'test'].includes(nodeEnv)) {
    console.error(`❌ Invalid NODE_ENV value: ${nodeEnv}. Use production, development, or test.`);
    process.exit(1);
  }

  const portNumber = Number(process.env.PORT);
  if (!Number.isInteger(portNumber) || portNumber <= 0) {
    console.error('❌ PORT must be a positive integer.');
    process.exit(1);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret.length < 32 && nodeEnv === 'production') {
    console.error('❌ JWT_SECRET must be at least 32 characters long in production.');
    process.exit(1);
  }

  const originKeys = ['CLIENT_WEB_DOMAIN', 'ADMIN_WEB_DOMAIN'];
  const invalidOrigins = originKeys.filter((key) => {
    const value = process.env[key];
    return !/^https?:\/\//i.test(value);
  });

  if (invalidOrigins.length) {
    console.error(`❌ Invalid domain format for: ${invalidOrigins.join(', ')}. Expected full origin with http/https.`);
    process.exit(1);
  }

  if (jwtSecret.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET is weak (< 32 chars). Use at least 32 characters.');
  }

  if (nodeEnv !== 'production') {
    console.warn(`ℹ️  NODE_ENV is set to ${nodeEnv}. Set to "production" for production deployments.`);
  }

  console.log('✅ Environment validation passed');
};

validateEnv();

// Initialize Express app
const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

const normalizeOrigin = (origin) => origin?.replace(/\/$/, '');

// Initialize Socket.IO with CORS for both client and admin
const allowedOrigins = [
  process.env.CLIENT_WEB_DOMAIN,
  process.env.ADMIN_WEB_DOMAIN
].map(normalizeOrigin).filter(Boolean);

console.log(`🔐 CORS & Socket.IO Allowed Origins: ${allowedOrigins.join(', ')}`);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests without origin (same-origin requests)
      // or if origin matches allowed list
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[Socket.IO] [cors-error] CORS blocked for origin: ${origin}`);
        callback(new Error('CORS not allowed for this origin'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  // Error handling configuration
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e6, // 1MB - prevent large payload attacks
  pingInterval: 25000,
  pingTimeout: 20000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true
  }
});

// Global Socket.IO error handler
io.on('error', (error) => {
  console.error(`[Socket.IO] [connection-error] Server error: ${error.message}`);
  console.error(`[Socket.IO] [connection-error] Stack: ${error.stack}`);
});

// Middleware - CORS Configuration
// Allows credentials (cookies, auth headers) from both frontend domains
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked for origin: ${origin}`);
      callback(new Error('CORS not allowed for this origin'));
    }
  },
  credentials: true,  // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Domain-based request routing middleware
// Ensures admin routes are only accessible from admin domain
app.use((req, res, next) => {
  const origin = req.get('origin') || req.get('referer');
  const adminDomain = process.env.ADMIN_WEB_DOMAIN;
  
  // Check if this is an admin endpoint
  // Admin routes include:
  // - All /api/admin/* routes
  // - Write operations (POST/PUT/DELETE/PATCH) on /api/tea
  // - Write operations on /api/shop/status
  // - All /api/library operations (write operations - POST/PUT/DELETE)
  const isAdminRoute = 
    req.path.startsWith('/api/admin') || 
    req.path.startsWith('/api/auth') ||
    (req.path.startsWith('/api/tea') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) ||
    (req.path.startsWith('/api/shop/status') && ['POST', 'PUT', 'DELETE'].includes(req.method)) ||
    (req.path.startsWith('/api/library') && ['POST', 'PUT', 'DELETE'].includes(req.method));
  
  if (isAdminRoute && origin && adminDomain) {
    // Admin routes should only be accessed from admin domain
    // Exception: /api/auth/login can be accessed from admin domain (it's public but admin-facing)
    const adminDomainHost = adminDomain.replace(/^https?:\/\//, '');
    if (!origin.includes(adminDomainHost)) {
      console.warn(`[Auth] [domain-restriction] Admin route blocked - Invalid origin: ${origin} (expected: ${adminDomain})`);
      return res.status(403).json({ 
        success: false,
        error: {
          message: 'Access denied: This resource is not available from your domain',
          code: 'domain_restricted'
        }
      });
    }
  }
  
  next();
});

// Security headers middleware
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Make io accessible to controllers
app.set('io', io);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Readiness endpoint
app.get('/api/ready', (_req, res) => {
  const ready = mongoose.connection.readyState === 1; // 1 = connected
  res.status(ready ? 200 : 503).json({ ready });
});

// Lightweight log ingest from frontend (non-blocking)
app.post('/api/logs', (req, res) => {
  const { level = 'info', message, meta } = req.body || {};
  if (message) {
    console.log(`[FE LOG] ${level}: ${message}`, meta || '');
  }
  res.status(204).end();
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/tea', teaRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/content', contentRoutes);

// 404 handler
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, error: { message: 'Route not found', code: 'not_found' } });
});

// Error handling middleware
app.use(errorHandler);

// Setup WebSocket handlers
setupWebSocket(io);

// Start server
const PORT = Number(process.env.PORT);

const startServer = async () => {
  try {
    await connectDB();

    try {
      const result = await ensureDefaultAdmin();
      if (result.created) {
        console.log(`✅ Default admin created: ${result.email}`);
      } else {
        console.log(`ℹ️  Default admin already exists: ${result.email}`);
      }
    } catch (error) {
      console.error('❌ Failed to ensure default admin:', error.message);
      throw error;
    }

    httpServer.listen(PORT, () => {
      console.log('=================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API: http://localhost:${PORT}/api`);
      console.log(`⚡ WebSocket: http://localhost:${PORT}`);
      console.log(`🔓 CORS Origins: ${allowedOrigins.join(', ')}`);
      console.log('=================================');
      console.log('✅ Server fully initialized and ready for connections');
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED PROMISE REJECTION:');
  console.error(`  Reason: ${reason?.message || reason}`);
  console.error(`  Promise: ${promise}`);
  console.error(`  Stack: ${reason?.stack || 'No stack trace'}`);
  // Don't exit - let app continue but log for debugging
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:');
  console.error(`  Message: ${error.message}`);
  console.error(`  Stack: ${error.stack}`);
  // Exit on uncaught exceptions as they're critical
  httpServer.close(() => process.exit(1));
});

export { io };
