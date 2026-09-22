require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const projectsRoutes = require('./routes/projects.routes');
const tasksRoutes = require('./routes/tasks.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const aiRoutes = require('./routes/ai.routes');

const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS configuration with robust origin matching (handles trailing slashes, whitespace, and localhost)
const corsOrigin = process.env.CORS_ORIGIN || '*';
const allowedOrigins = corsOrigin === '*'
  ? '*'
  : corsOrigin.split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server health checks)
      if (!origin || allowedOrigins === '*') {
        return callback(null, true);
      }
      const normalizedOrigin = origin.trim().replace(/\/+$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      // Allow localhost in non-production environments
      if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(normalizedOrigin)) {
        return callback(null, true);
      }
      callback(new Error("CORS policy error: Origin " + origin + " is not allowed by CORS"));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'DevPulse REST API Backend',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// 404 Not Found Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
