require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Middleware
const { authMiddleware } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// Routes
const projectsRouter = require('./routes/projects');
const enterpriseRouter = require('./routes/enterprise');
const graphRouter = require('./routes/graph');
const chatRouter = require('./routes/chat');
const adminRouter = require('./routes/admin');
const goldenQaRouter = require('./routes/goldenQa');
const { router: documentsRouter } = require('./routes/documents');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health & Liveness probes
app.get(['/health', '/livez', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Company Brain API',
    team: 'Team 20',
    timestamp: new Date().toISOString()
  });
});

app.get('/healthz', async (req, res) => {
  const { pool } = require('../../scripts/loaders/db_pool');
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      azure_openai_endpoint: process.env.AZURE_OPENAI_ENDPOINT ? 'configured' : 'offline_fallback',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      database_error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Welcome to Company Brain (AutoNova Group)',
    team: 'Team 20',
    model_provider: 'Azure OpenAI (Azure AI Foundry)'
  });
});

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Auth middleware for all API routes
app.use('/api', authMiddleware);

// Mount API routes
app.use('/api/projects', projectsRouter);
app.use('/api/enterprise', enterpriseRouter);
app.use('/api/graph', graphRouter);
app.use('/api/chat', chatRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/golden-qa', goldenQaRouter);
app.use('/api/qa', goldenQaRouter);

// Serve static frontend assets from React build
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// SPA catch-all route to support React Router client-side navigation
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

// Centralized Error Handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Company Brain (Team 20) is live!`);
  console.log(`🌐 Application URL: http://localhost:${PORT}`);
  console.log(`📡 Health Check:    http://localhost:${PORT}/health`);
  console.log(`======================================================\n`);
});

module.exports = app;
