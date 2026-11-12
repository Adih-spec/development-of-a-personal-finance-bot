/**
 * server.js
 * Naira Finance App – Express.js entry point
 */
require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');

const { testConnection }    = require('./config/database');
const { errorHandler }      = require('./middleware/errorHandler');

// Route imports
const authRoutes      = require('./routes/authRoutes');
const incomeRoutes    = require('./routes/incomeRoutes');
const expenseRoutes   = require('./routes/expenseRoutes');
const categoryRoutes  = require('./routes/categoryRoutes');
const budgetRoutes    = require('./routes/budgetRoutes');
const savingsRoutes   = require('./routes/savingsRoutes');
const ajoRoutes       = require('./routes/ajoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes    = require('./routes/reportRoutes');
const syncRoutes      = require('./routes/syncRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security middleware ────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: '*',          // tighten in production
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max:      parseInt(process.env.RATE_LIMIT_MAX       || '100'),
  message:  { status: 'error', message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
});
app.use(limiter);

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/income',    incomeRoutes);
app.use('/api/expenses',  expenseRoutes);
app.use('/api/categories',categoryRoutes);
app.use('/api/budgets',   budgetRoutes);
app.use('/api/savings',   savingsRoutes);
app.use('/api/ajo',       ajoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports',   reportRoutes);
app.use('/api/sync',      syncRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found.' });
});

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────
const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Naira Finance API running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

start();

module.exports = app;
