const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { initializeDatabase } = require('./models/database');
const expenseRoutes = require('./routes/expenses');
const { errorHandler } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE (Runs before every request)
// ============================================================

// CORS: Allow frontend to make requests from different domain
// Without this, browser blocks cross-origin requests
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Parse incoming JSON request bodies
// Without this, req.body would be undefined
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware (optional but useful for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================================
// ROUTES (Where requests go)
// ============================================================

// Health check endpoint (useful for monitoring)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// All expense endpoints
app.use('/api/expenses', expenseRoutes);

// 404 handler (if no route matched)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'This endpoint does not exist'
    }
  });
});

// ============================================================
// ERROR HANDLER (Catches all errors from routes)
// ============================================================
app.use(errorHandler);

// ============================================================
// SERVER STARTUP
// ============================================================

// Initialize database first, then start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Frontend: http://localhost:3000`);
      console.log(`💾 Database: ./data/database.db\n`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});
