// server.js — LensSpace Backend Entry Point
require('dotenv').config();
const express      = require('express');
const session      = require('express-session');
const { MongoStore } = require('connect-mongo');
const cors         = require('cors');
const path         = require('path');
const fs           = require('fs');

const connectDB    = require('./backend/config/db');
const authRoutes   = require('./backend/routes/authRoutes');
const studioRoutes = require('./backend/routes/studioRoutes');
const bookingRoutes= require('./backend/routes/bookingRoutes');
const adminRoutes  = require('./backend/routes/adminRoutes');
const errorHandler = require('./backend/middleware/errorHandler');
const AppError     = require('./backend/utils/AppError');

// ── Connect to MongoDB Atlas ──────────────────────────────────────
connectDB();

// ── Ensure uploads/ directory exists ─────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const app = express();

// ── CORS ──────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,   // Allow cookies/sessions across origins
}));

// ── Body Parsers ──────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session (stored in MongoDB via connect-mongo) ─────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'lensspace_dev_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60, // 7 days
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },
}));

// ── Static Files ──────────────────────────────────────────────────
// Serve the frontend (photostudio/) at root
app.use(express.static(path.join(__dirname, 'photostudio')));
// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/studios', studioRoutes);
app.use('/api/bookings',bookingRoutes);
app.use('/api/admin',   adminRoutes);

// ── Health Check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'LensSpace API is running 🚀' })
);

// ── Catch-all: serve frontend SPA or 404 for unknown API routes ──
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next(new AppError(`Route ${req.originalUrl} not found`, 404));
  }
  res.sendFile(path.join(__dirname, 'photostudio', 'index.html'));
});


// ── Global Error Handler ──────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 LensSpace server running on http://localhost:${PORT}`);
  console.log(`📁 Serving frontend from: photostudio/`);
  console.log(`🗂️  API available at:      http://localhost:${PORT}/api\n`);
});
